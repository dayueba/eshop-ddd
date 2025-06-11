import { ValueObject } from '../../../shared/domain/ValueObject';

interface PaymentIdProps {
  value: string;
}

export class PaymentId extends ValueObject<PaymentIdProps> {
  constructor(value: string) {
    super({ value });
  }

  public getValue(): string {
    return this.props.value;
  }

  public static create(value?: string): PaymentId {
    if (value) {
      return new PaymentId(value);
    }
    return new PaymentId(this.generateId());
  }

  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  public equals(other: PaymentId): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
} 