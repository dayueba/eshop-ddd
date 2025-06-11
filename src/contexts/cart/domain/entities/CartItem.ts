import { Entity } from '../../../../shared/domain/Entity';
import { ProductId } from '../../../product/domain/value-objects/ProductId';
import { Price } from '../../../product/domain/value-objects/Price';
import { Quantity } from '../value-objects/Quantity';

interface CartItemProps {
  productId: ProductId;
  productName: string;
  price: Price;
  quantity: Quantity;
  addedAt: Date;
}

export class CartItem extends Entity<CartItemProps> {
  public static create(
    productId: ProductId,
    productName: string,
    price: Price,
    quantity: Quantity
  ): CartItem {
    return new CartItem({
      productId,
      productName,
      price,
      quantity,
      addedAt: new Date()
    });
  }

  public getProductId(): ProductId {
    return this.props.productId;
  }

  public getProductName(): string {
    return this.props.productName;
  }

  public getPrice(): Price {
    return this.props.price;
  }

  public getQuantity(): Quantity {
    return this.props.quantity;
  }

  public getAddedAt(): Date {
    return this.props.addedAt;
  }

  public updateQuantity(quantity: Quantity): void {
    if (quantity.isZero()) {
      throw new Error('数量不能为0，请移除商品');
    }
    this.props.quantity = quantity;
  }

  public updatePrice(price: Price): void {
    this.props.price = price;
  }

  public getTotalPrice(): Price {
    return this.props.price.multiply(this.props.quantity.getValue());
  }

  public increaseQuantity(amount: Quantity): void {
    this.props.quantity = this.props.quantity.add(amount);
  }

  public decreaseQuantity(amount: Quantity): void {
    const newQuantity = this.props.quantity.subtract(amount);
    if (newQuantity.isZero()) {
      throw new Error('数量不能为0，请移除商品');
    }
    this.props.quantity = newQuantity;
  }

  protected validate(): void {
    if (!this.props.productId) {
      throw new Error('商品ID不能为空');
    }
    if (!this.props.productName || this.props.productName.trim().length === 0) {
      throw new Error('商品名称不能为空');
    }
    if (!this.props.price) {
      throw new Error('商品价格不能为空');
    }
    if (!this.props.quantity) {
      throw new Error('商品数量不能为空');
    }
    if (this.props.quantity.isZero()) {
      throw new Error('商品数量不能为0');
    }
  }
} 