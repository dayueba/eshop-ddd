import { injectable, inject } from 'inversify';
import { Command } from '../../../../shared/application/UseCase';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderId } from '../../domain/value-objects/OrderId';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../../domain/enums';
import { EventBus } from '../../../../shared/domain/EventBus';
import { TYPES } from '../../../../config/container';

export interface UpdateOrderStatusRequest {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
  trackingNumber?: string;
  reason?: string; // 状态变更原因
}

export interface UpdateOrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  updatedAt: Date;
}

@injectable()
export class UpdateOrderStatusCommand implements Command<UpdateOrderStatusRequest, UpdateOrderStatusResponse> {
  constructor(
    @inject(TYPES.OrderRepository) private orderRepository: OrderRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    const orderId = OrderId.fromString(request.orderId);
    
    // 1. 获取订单
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 2. 更新订单状态
    if (request.status !== undefined) {
      order.updateStatus(request.status);
    }

    if (request.paymentStatus !== undefined) {
      order.updatePaymentStatus(request.paymentStatus);
    }

    if (request.shippingStatus !== undefined) {
      order.updateShippingStatus(request.shippingStatus);
    }

    // 3. 处理特殊状态变更
    if (request.status === OrderStatus.CANCELLED) {
      order.cancel(request.reason || '用户取消');
    }

    if (request.paymentStatus === PaymentStatus.PAID) {
      order.markAsPaid();
    }

    if (request.shippingStatus === ShippingStatus.SHIPPED && request.trackingNumber) {
      order.ship(request.trackingNumber);
    }

    if (request.status === OrderStatus.COMPLETED) {
      order.complete();
    }

    // 4. 保存订单
    await this.orderRepository.save(order);

    // 5. 发布领域事件
    await this.eventBus.publishAll(order.getUncommittedEvents());
    order.markEventsAsCommitted();

    return {
      orderId: order.getId().toString(),
      status: order.getStatus(),
      paymentStatus: order.getPaymentStatus(),
      shippingStatus: order.getShippingStatus(),
      updatedAt: order.getUpdatedAt()
    };
  }
} 