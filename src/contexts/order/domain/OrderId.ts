import { ValueObject } from '../../../shared/domain/ValueObject';

interface OrderIdProps {
  value: string;
}

export class OrderId extends ValueObject<OrderIdProps> {
  constructor(value: string) {
    super({ value });
  }

  public getValue(): string {
    return this.props.value;
  }

  public static create(value?: string): OrderId {
    if (value) {
      return new OrderId(value);
    }
    return new OrderId(this.generateId());
  }

  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  public equals(other: OrderId): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
} 