import { Entity } from '../../../../shared/domain/Entity';
import { Money } from '../value-objects/Money';

interface OrderItemIdProps {
  value: string;
}

export class OrderItemId extends Entity<OrderItemIdProps> {
  constructor(value: string) {
    super({ value });
  }

  public getValue(): string {
    return this.props.value;
  }

  public static create(): OrderItemId {
    return new OrderItemId(Date.now().toString() + Math.random().toString(36).substr(2, 9));
  }

  public toString(): string {
    return this.props.value;
  }
}

interface ProductSnapshot {
  name: string;
  description: string;
  imageUrl: string;
  attributes?: Record<string, any>;
}

interface OrderItemProps {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  discountAmount: Money;
  productSnapshot: ProductSnapshot;
}

export class OrderItem extends Entity<OrderItemId> {
  private constructor(private props: OrderItemProps, id?: OrderItemId) {
    super(id || OrderItemId.create());
    this.validate();
  }

  private validate(): void {
    if (!this.props.productId) {
      throw new Error('商品ID不能为空');
    }

    if (!this.props.productName || this.props.productName.trim().length === 0) {
      throw new Error('商品名称不能为空');
    }

    if (!this.props.sku || this.props.sku.trim().length === 0) {
      throw new Error('商品SKU不能为空');
    }

    if (this.props.quantity <= 0) {
      throw new Error('商品数量必须大于0');
    }

    if (!Number.isInteger(this.props.quantity)) {
      throw new Error('商品数量必须是整数');
    }

    // 验证总价 = 单价 * 数量 - 折扣
    const expectedTotal = this.props.unitPrice.multiply(this.props.quantity).subtract(this.props.discountAmount);
    if (!this.props.totalPrice.equals(expectedTotal)) {
      throw new Error('订单项总价计算错误');
    }
  }

  public static create(
    productId: string,
    productName: string,
    sku: string,
    quantity: number,
    unitPrice: Money,
    discountAmount: Money = Money.zero(unitPrice.getCurrency()),
    productSnapshot: ProductSnapshot
  ): OrderItem {
    const totalPrice = unitPrice.multiply(quantity).subtract(discountAmount);

    return new OrderItem({
      productId,
      productName: productName.trim(),
      sku: sku.trim(),
      quantity,
      unitPrice,
      totalPrice,
      discountAmount,
      productSnapshot
    });
  }

  public static reconstitute(props: OrderItemProps, id: OrderItemId): OrderItem {
    return new OrderItem(props, id);
  }

  // Getters
  public getProductId(): string {
    return this.props.productId;
  }

  public getProductName(): string {
    return this.props.productName;
  }

  public getSku(): string {
    return this.props.sku;
  }

  public getQuantity(): number {
    return this.props.quantity;
  }

  public getUnitPrice(): Money {
    return this.props.unitPrice;
  }

  public getTotalPrice(): Money {
    return this.props.totalPrice;
  }

  public getDiscountAmount(): Money {
    return this.props.discountAmount;
  }

  public getProductSnapshot(): ProductSnapshot {
    return { ...this.props.productSnapshot };
  }

  // 业务方法
  public updateQuantity(quantity: number): OrderItem {
    if (quantity <= 0) {
      throw new Error('商品数量必须大于0');
    }

    if (!Number.isInteger(quantity)) {
      throw new Error('商品数量必须是整数');
    }

    const totalPrice = this.props.unitPrice.multiply(quantity).subtract(this.props.discountAmount);

    return new OrderItem({
      ...this.props,
      quantity,
      totalPrice
    }, this.id);
  }

  public applyDiscount(discountAmount: Money): OrderItem {
    if (discountAmount.getCurrency() !== this.props.unitPrice.getCurrency()) {
      throw new Error('折扣货币类型必须与商品价格一致');
    }

    const maxDiscount = this.props.unitPrice.multiply(this.props.quantity);
    if (discountAmount.isGreaterThan(maxDiscount)) {
      throw new Error('折扣金额不能超过商品总价');
    }

    const totalPrice = this.props.unitPrice.multiply(this.props.quantity).subtract(discountAmount);

    return new OrderItem({
      ...this.props,
      discountAmount,
      totalPrice
    }, this.id);
  }

  // 计算方法
  public getSubtotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }

  public getDiscountPercentage(): number {
    const subtotal = this.getSubtotal();
    if (subtotal.isZero()) {
      return 0;
    }
    return (this.props.discountAmount.getAmount() / subtotal.getAmount()) * 100;
  }

  public hasDiscount(): boolean {
    return !this.props.discountAmount.isZero();
  }

  // 序列化
  public toJSON() {
    return {
      id: this.id.getValue(),
      productId: this.props.productId,
      productName: this.props.productName,
      sku: this.props.sku,
      quantity: this.props.quantity,
      unitPrice: this.props.unitPrice.toJSON(),
      totalPrice: this.props.totalPrice.toJSON(),
      discountAmount: this.props.discountAmount.toJSON(),
      subtotal: this.getSubtotal().toJSON(),
      discountPercentage: this.getDiscountPercentage(),
      hasDiscount: this.hasDiscount(),
      productSnapshot: this.props.productSnapshot
    };
  }
} 