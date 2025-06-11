import { ValueObject } from '../../../../shared/domain/ValueObject';

interface QuantityProps {
  value: number;
}

export class Quantity extends ValueObject<QuantityProps> {
  public static create(value: number): Quantity {
    return new Quantity({ value });
  }

  public getValue(): number {
    return this.props.value;
  }

  public add(quantity: Quantity): Quantity {
    return new Quantity({ value: this.props.value + quantity.props.value });
  }

  public subtract(quantity: Quantity): Quantity {
    const newValue = this.props.value - quantity.props.value;
    if (newValue < 0) {
      throw new Error('数量不能为负数');
    }
    return new Quantity({ value: newValue });
  }

  public isZero(): boolean {
    return this.props.value === 0;
  }

  public isGreaterThan(quantity: Quantity): boolean {
    return this.props.value > quantity.props.value;
  }

  protected validate(props: QuantityProps): void {
    if (props.value < 0) {
      throw new Error('商品数量不能为负数');
    }
    if (!Number.isInteger(props.value)) {
      throw new Error('商品数量必须为整数');
    }
    if (props.value > 9999) {
      throw new Error('商品数量不能超过9999');
    }
  }
} 