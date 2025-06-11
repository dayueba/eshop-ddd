import { ValueObject } from '../../../../shared/domain/ValueObject';

interface OrderNumberProps {
  value: string;
}

export class OrderNumber extends ValueObject<OrderNumberProps> {
  constructor(value: string) {
    super({ value });
    this.validate();
  }

  private validate(): void {
    if (!this.props.value || typeof this.props.value !== 'string') {
      throw new Error('订单号不能为空');
    }

    // 订单号格式：年月日 + 6位随机数，如 20241215123456
    const orderNumberRegex = /^\d{14}$/;
    if (!orderNumberRegex.test(this.props.value)) {
      throw new Error('订单号格式无效');
    }
  }

  public getValue(): string {
    return this.props.value;
  }

  public equals(other: OrderNumber): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }

  public static generate(): OrderNumber {
    const now = new Date();
    const datePart = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0');
    const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return new OrderNumber(datePart + randomPart);
  }

  public getDatePart(): string {
    return this.props.value.substring(0, 8);
  }

  public getSequencePart(): string {
    return this.props.value.substring(8);
  }

  public toJSON(): string {
    return this.props.value;
  }
} 