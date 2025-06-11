import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { CartId } from '../value-objects/CartId';
import { UserId } from '../../../user/domain/value-objects/UserId';

interface CartClearedEventProps {
  cartId: CartId;
  userId: UserId;
  itemCount: number;
  occurredOn: Date;
}

export class CartClearedEvent extends DomainEvent<CartClearedEventProps> {
  public static create(
    cartId: CartId,
    userId: UserId,
    itemCount: number
  ): CartClearedEvent {
    return new CartClearedEvent({
      cartId,
      userId,
      itemCount,
      occurredOn: new Date()
    });
  }

  public getCartId(): CartId {
    return this.props.cartId;
  }

  public getUserId(): UserId {
    return this.props.userId;
  }

  public getItemCount(): number {
    return this.props.itemCount;
  }
} 