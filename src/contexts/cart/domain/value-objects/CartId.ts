import { ValueObject } from '../../../../shared/domain/ValueObject';
import { randomUUID } from 'crypto';

interface CartIdProps {
  value: string;
}

export class CartId extends ValueObject<CartIdProps> {
  public static create(value?: string): CartId {
    return new CartId({ value: value || randomUUID() });
  }

  public static fromString(value: string): CartId {
    if (!value || value.trim().length === 0) {
      throw new Error('购物车ID不能为空');
    }
    return new CartId({ value });
  }

  public toString(): string {
    return this.props.value;
  }

  protected validate(props: CartIdProps): void {
    if (!props.value || props.value.trim().length === 0) {
      throw new Error('购物车ID不能为空');
    }
  }
} 