import { injectable, inject } from 'inversify';
import { Query } from '../../../../shared/application/UseCase';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderId } from '../../domain/value-objects/OrderId';
import { OrderDTO } from './GetOrdersQuery';
import { TYPES } from '../../../../config/container';

export interface GetOrderByIdRequest {
  orderId: string;
  userId?: string; // 可选，用于权限验证
}

export interface GetOrderByIdResponse {
  order: OrderDTO | null;
}

@injectable()
export class GetOrderByIdQuery implements Query<GetOrderByIdRequest, GetOrderByIdResponse> {
  constructor(
    @inject(TYPES.OrderRepository) private orderRepository: OrderRepository
  ) {}

  public async execute(request: GetOrderByIdRequest): Promise<GetOrderByIdResponse> {
    const orderId = OrderId.fromString(request.orderId);
    
    // 获取订单
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      return { order: null };
    }

    // 权限验证：如果提供了userId，验证订单是否属于该用户
    if (request.userId && order.getUserId().toString() !== request.userId) {
      throw new Error('无权访问该订单');
    }

    // 转换为DTO
    const orderDTO: OrderDTO = {
      id: order.getId().toString(),
      orderNumber: order.getOrderNumber().getValue(),
      userId: order.getUserId().toString(),
      items: order.getItems().map(item => ({
        productId: item.getProductId().toString(),
        productName: item.getProductName(),
        productSku: item.getProductSku(),
        price: {
          amount: item.getPrice().getAmount(),
          currency: item.getPrice().getCurrency()
        },
        quantity: item.getQuantity().getValue(),
        subtotal: {
          amount: item.getSubtotal().getAmount(),
          currency: item.getSubtotal().getCurrency()
        }
      })),
      totalAmount: {
        amount: order.getTotalAmount().getAmount(),
        currency: order.getTotalAmount().getCurrency()
      },
      shippingAddress: {
        street: order.getShippingAddress().getStreet(),
        city: order.getShippingAddress().getCity(),
        state: order.getShippingAddress().getState(),
        zipCode: order.getShippingAddress().getZipCode(),
        country: order.getShippingAddress().getCountry(),
        contactName: order.getShippingAddress().getContactName(),
        contactPhone: order.getShippingAddress().getContactPhone()
      },
      status: order.getStatus(),
      paymentStatus: order.getPaymentStatus(),
      shippingStatus: order.getShippingStatus(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt()
    };

    return { order: orderDTO };
  }
} 