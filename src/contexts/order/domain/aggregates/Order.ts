import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { OrderId } from '../OrderId';
import { OrderNumber } from '../value-objects/OrderNumber';
import { Money } from '../value-objects/Money';
import { Address } from '../value-objects/Address';
import { OrderItem } from '../entities/OrderItem';
import { OrderStatus, PaymentStatus, ShippingStatus, PaymentMethod } from '../enums';
import { OrderCreatedEvent } from '../events/OrderCreatedEvent';
import { OrderPaidEvent } from '../events/OrderPaidEvent';
import { OrderCancelledEvent } from '../events/OrderCancelledEvent';
import { OrderShippedEvent } from '../events/OrderShippedEvent';
import { OrderDeliveredEvent } from '../events/OrderDeliveredEvent';

interface OrderMetadata {
  couponCode?: string;
  promotionId?: string;
  channel: string;
  userAgent?: string;
  ipAddress?: string;
}

interface OrderProps {
  orderNumber: OrderNumber;
  customerId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: Money;
  discountAmount: Money;
  shippingFee: Money;
  taxAmount: Money;
  totalAmount: Money;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  orderDate: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  metadata: OrderMetadata;
}

export class Order extends AggregateRoot<OrderId> {
  private constructor(private props: OrderProps, id?: OrderId) {
    super(id || OrderId.create());
    this.validate();
  }

  private validate(): void {
    if (!this.props.customerId) {
      throw new Error('客户ID不能为空');
    }

    if (!this.props.items || this.props.items.length === 0) {
      throw new Error('订单必须包含至少一个商品');
    }

    // 验证金额计算
    const calculatedSubtotal = this.calculateSubtotal();
    if (!this.props.subtotal.equals(calculatedSubtotal)) {
      throw new Error('订单小计计算错误');
    }

    const calculatedTotal = this.props.subtotal
      .subtract(this.props.discountAmount)
      .add(this.props.shippingFee)
      .add(this.props.taxAmount);

    if (!this.props.totalAmount.equals(calculatedTotal)) {
      throw new Error('订单总金额计算错误');
    }

    // 状态一致性验证
    if (this.props.status === OrderStatus.PAID && this.props.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new Error('订单状态与支付状态不一致');
    }

    if (this.props.status === OrderStatus.SHIPPED && this.props.shippingStatus !== ShippingStatus.SHIPPED) {
      throw new Error('订单状态与发货状态不一致');
    }
  }

  // 静态工厂方法
  public static create(
    customerId: string,
    items: OrderItem[],
    shippingAddress: Address,
    billingAddress: Address,
    paymentMethod: PaymentMethod,
    shippingFee: Money = Money.zero(items[0].getUnitPrice().getCurrency()),
    taxAmount: Money = Money.zero(items[0].getUnitPrice().getCurrency()),
    discountAmount: Money = Money.zero(items[0].getUnitPrice().getCurrency()),
    notes?: string,
    metadata: Partial<OrderMetadata> = {}
  ): Order {
    if (!items || items.length === 0) {
      throw new Error('订单必须包含至少一个商品');
    }

    const id = OrderId.create();
    const orderNumber = OrderNumber.generate();
    const now = new Date();

    // 计算订单金额
    const subtotal = Order.calculateSubtotalFromItems(items);
    const totalAmount = subtotal.subtract(discountAmount).add(shippingFee).add(taxAmount);

    const order = new Order({
      orderNumber,
      customerId,
      items: [...items],
      shippingAddress,
      billingAddress,
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount,
      paymentMethod,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingStatus: ShippingStatus.PENDING,
      orderDate: now,
      notes,
      metadata: {
        channel: 'web',
        ...metadata
      }
    }, id);

    // 发布订单创建事件
    order.addDomainEvent(new OrderCreatedEvent(
      id.getValue(),
      orderNumber.getValue(),
      customerId,
      totalAmount.toJSON(),
      items.map(item => ({
        productId: item.getProductId(),
        quantity: item.getQuantity(),
        unitPrice: item.getUnitPrice().toJSON()
      }))
    ));

    return order;
  }

  public static reconstitute(props: OrderProps, id: OrderId): Order {
    return new Order(props, id);
  }

  // 计算方法
  private calculateSubtotal(): Money {
    return Order.calculateSubtotalFromItems(this.props.items);
  }

  private static calculateSubtotalFromItems(items: OrderItem[]): Money {
    if (items.length === 0) {
      throw new Error('订单项不能为空');
    }

    let subtotal = Money.zero(items[0].getUnitPrice().getCurrency());
    for (const item of items) {
      subtotal = subtotal.add(item.getTotalPrice());
    }
    return subtotal;
  }

  // Getters
  public getOrderNumber(): OrderNumber {
    return this.props.orderNumber;
  }

  public getCustomerId(): string {
    return this.props.customerId;
  }

  public getItems(): OrderItem[] {
    return [...this.props.items];
  }

  public getShippingAddress(): Address {
    return this.props.shippingAddress;
  }

  public getBillingAddress(): Address {
    return this.props.billingAddress;
  }

  public getSubtotal(): Money {
    return this.props.subtotal;
  }

  public getDiscountAmount(): Money {
    return this.props.discountAmount;
  }

  public getShippingFee(): Money {
    return this.props.shippingFee;
  }

  public getTaxAmount(): Money {
    return this.props.taxAmount;
  }

  public getTotalAmount(): Money {
    return this.props.totalAmount;
  }

  public getPaymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  public getStatus(): OrderStatus {
    return this.props.status;
  }

  public getPaymentStatus(): PaymentStatus {
    return this.props.paymentStatus;
  }

  public getShippingStatus(): ShippingStatus {
    return this.props.shippingStatus;
  }

  public getOrderDate(): Date {
    return this.props.orderDate;
  }

  public getPaidAt(): Date | undefined {
    return this.props.paidAt;
  }

  public getShippedAt(): Date | undefined {
    return this.props.shippedAt;
  }

  public getDeliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }

  public getNotes(): string | undefined {
    return this.props.notes;
  }

  public getMetadata(): OrderMetadata {
    return { ...this.props.metadata };
  }

  // 业务方法
  public pay(paymentId: string): void {
    if (this.props.status !== OrderStatus.PENDING) {
      throw new Error('只有待支付订单才能进行支付');
    }

    if (this.props.paymentStatus !== PaymentStatus.PENDING) {
      throw new Error('订单支付状态异常');
    }

    const now = new Date();
    this.props.status = OrderStatus.PAID;
    this.props.paymentStatus = PaymentStatus.COMPLETED;
    this.props.paidAt = now;

    // 发布支付完成事件
    this.addDomainEvent(new OrderPaidEvent(
      this.id.getValue(),
      paymentId,
      this.props.totalAmount.toJSON(),
      now
    ));
  }

  public startProcessing(): void {
    if (this.props.status !== OrderStatus.PAID) {
      throw new Error('只有已支付订单才能开始处理');
    }

    this.props.status = OrderStatus.PROCESSING;
    this.props.shippingStatus = ShippingStatus.PREPARING;
  }

  public ship(shipmentId: string, trackingNumber: string, carrier: string): void {
    if (this.props.status !== OrderStatus.PROCESSING) {
      throw new Error('只有处理中的订单才能发货');
    }

    const now = new Date();
    this.props.status = OrderStatus.SHIPPED;
    this.props.shippingStatus = ShippingStatus.SHIPPED;
    this.props.shippedAt = now;

    // 发布发货事件
    this.addDomainEvent(new OrderShippedEvent(
      this.id.getValue(),
      shipmentId,
      trackingNumber,
      carrier
    ));
  }

  public deliver(): void {
    if (this.props.status !== OrderStatus.SHIPPED) {
      throw new Error('只有已发货订单才能确认送达');
    }

    const now = new Date();
    this.props.status = OrderStatus.DELIVERED;
    this.props.shippingStatus = ShippingStatus.DELIVERED;
    this.props.deliveredAt = now;

    // 发布送达事件
    this.addDomainEvent(new OrderDeliveredEvent(
      this.id.getValue(),
      now
    ));
  }

  public complete(): void {
    if (this.props.status !== OrderStatus.DELIVERED) {
      throw new Error('只有已送达订单才能完成');
    }

    this.props.status = OrderStatus.COMPLETED;
  }

  public cancel(reason: string): void {
    // 已发货的订单不能取消
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(this.props.status)) {
      throw new Error('已发货的订单不能取消');
    }

    // 如果已支付，需要退款
    if (this.props.status === OrderStatus.PAID || this.props.status === OrderStatus.PROCESSING) {
      this.props.paymentStatus = PaymentStatus.REFUNDED;
    }

    const now = new Date();
    this.props.status = OrderStatus.CANCELLED;

    // 发布取消事件
    this.addDomainEvent(new OrderCancelledEvent(
      this.id.getValue(),
      reason,
      now
    ));
  }

  public refund(): void {
    if (this.props.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new Error('只有已完成支付的订单才能退款');
    }

    this.props.status = OrderStatus.REFUNDED;
    this.props.paymentStatus = PaymentStatus.REFUNDED;
  }

  // 业务查询方法
  public isPaid(): boolean {
    return this.props.paymentStatus === PaymentStatus.COMPLETED;
  }

  public canCancel(): boolean {
    return ![OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(this.props.status);
  }

  public canRefund(): boolean {
    return this.props.paymentStatus === PaymentStatus.COMPLETED;
  }

  public isExpired(expireMinutes: number = 30): boolean {
    if (this.props.status !== OrderStatus.PENDING) {
      return false;
    }

    const expireTime = new Date(this.props.orderDate.getTime() + expireMinutes * 60 * 1000);
    return new Date() > expireTime;
  }

  public getTotalItemCount(): number {
    return this.props.items.reduce((total, item) => total + item.getQuantity(), 0);
  }

  public hasItem(productId: string): boolean {
    return this.props.items.some(item => item.getProductId() === productId);
  }

  public getItem(productId: string): OrderItem | undefined {
    return this.props.items.find(item => item.getProductId() === productId);
  }

  // 序列化
  public toJSON() {
    return {
      id: this.id.getValue(),
      orderNumber: this.props.orderNumber.getValue(),
      customerId: this.props.customerId,
      items: this.props.items.map(item => item.toJSON()),
      shippingAddress: this.props.shippingAddress.toJSON(),
      billingAddress: this.props.billingAddress.toJSON(),
      pricing: {
        subtotal: this.props.subtotal.toJSON(),
        discount: this.props.discountAmount.toJSON(),
        shippingFee: this.props.shippingFee.toJSON(),
        tax: this.props.taxAmount.toJSON(),
        total: this.props.totalAmount.toJSON()
      },
      paymentMethod: this.props.paymentMethod,
      status: this.props.status,
      paymentStatus: this.props.paymentStatus,
      shippingStatus: this.props.shippingStatus,
      orderDate: this.props.orderDate.toISOString(),
      paidAt: this.props.paidAt?.toISOString(),
      shippedAt: this.props.shippedAt?.toISOString(),
      deliveredAt: this.props.deliveredAt?.toISOString(),
      notes: this.props.notes,
      metadata: this.props.metadata,
      totalItemCount: this.getTotalItemCount(),
      canCancel: this.canCancel(),
      canRefund: this.canRefund(),
      isPaid: this.isPaid()
    };
  }
}