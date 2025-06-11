import { ValueObject } from '../../../shared/domain/ValueObject';

interface ProductIdProps {
  value: string;
}

export class ProductId extends ValueObject<ProductIdProps> {
  constructor(value: string) {
    super({ value });
  }

  public getValue(): string {
    return this.props.value;
  }

  public static create(value?: string): ProductId {
    if (value) {
      return new ProductId(value);
    }
    return new ProductId(this.generateId());
  }

  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  public equals(other: ProductId): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
} 