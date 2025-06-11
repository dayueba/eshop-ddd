import { ValueObject } from '../../../shared/domain/ValueObject';

interface CategoryIdProps {
  value: string;
}

export class CategoryId extends ValueObject<CategoryIdProps> {
  constructor(value: string) {
    super({ value });
  }

  public getValue(): string {
    return this.props.value;
  }

  public static create(value?: string): CategoryId {
    if (value) {
      return new CategoryId(value);
    }
    return new CategoryId(this.generateId());
  }

  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  public equals(other: CategoryId): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
} 