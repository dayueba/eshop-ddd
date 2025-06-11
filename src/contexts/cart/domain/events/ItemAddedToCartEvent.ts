import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { CartId } from '../value-objects/CartId';
import { ProductId } from '../../../product/domain/value-objects/ProductId';
import { Quantity } from '../value-objects/Quantity';
import { UserId } from '../../../user/domain/value-objects/UserId';

interface ItemAddedToCartEventProps {
  cartId: CartId;
  userId: UserId;
  productId: ProductId;
  productName: string;
  quantity: Quantity;
  occurredOn: Date;
}

export class ItemAddedToCartEvent extends DomainEvent<ItemAddedToCartEventProps> {
  public static create(
    cartId: CartId,
    userId: UserId,
    productId: ProductId,
    productName: string,
    quantity: Quantity
  ): ItemAddedToCartEvent {
    return new ItemAddedToCartEvent({
      cartId,
      userId,
      productId,
      productName,
      quantity,
      occurredOn: new Date()
    });
  }

  public getCartId(): CartId {
    return this.props.cartId;
  }

  public getUserId(): UserId {
    return this.props.userId;
  }

  public getProductId(): ProductId {
    return this.props.productId;
  }

  public getProductName(): string {
    return this.props.productName;
  }

  public getQuantity(): Quantity {
    return this.props.quantity;
  }
} 