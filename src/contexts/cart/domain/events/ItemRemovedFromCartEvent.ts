import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { CartId } from '../value-objects/CartId';
import { ProductId } from '../../../product/domain/value-objects/ProductId';
import { UserId } from '../../../user/domain/value-objects/UserId';

interface ItemRemovedFromCartEventProps {
  cartId: CartId;
  userId: UserId;
  productId: ProductId;
  productName: string;
  occurredOn: Date;
}

export class ItemRemovedFromCartEvent extends DomainEvent<ItemRemovedFromCartEventProps> {
  public static create(
    cartId: CartId,
    userId: UserId,
    productId: ProductId,
    productName: string
  ): ItemRemovedFromCartEvent {
    return new ItemRemovedFromCartEvent({
      cartId,
      userId,
      productId,
      productName,
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
} 