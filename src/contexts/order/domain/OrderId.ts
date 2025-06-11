import { ValueObject } from '../../../shared/domain/ValueObject';
import { IdGenerator } from '../../../shared/domain/IdGenerator';
import { IdGeneratorFactory } from '../../../shared/infrastructure/MongoIdGenerator';

interface OrderIdProps {
  value: string;
}

export class OrderId extends ValueObject<OrderIdProps> {
  private static readonly idGenerator: IdGenerator<string> = IdGeneratorFactory.createForMongo();

  constructor(value: string) {
    super({ value });
    this.validate();
  }

  public getValue(): string {
    return this.props.value;
  }

  /**
   * 创建OrderId
   * @param value 可选的ID值，如果未提供则自动生成
   */
  public static create(value?: string): OrderId {
    if (value) {
      return new OrderId(value);
    }
    return new OrderId(this.idGenerator.nextId());
  }

  /**
   * 验证ID是否有效
   */
  public static isValid(value: string): boolean {
    return this.idGenerator.isValid(value);
  }

  /**
   * 比较两个OrderId是否相等
   */
  public equals(other?: ValueObject<OrderIdProps>): boolean {
    if (!other || !(other instanceof OrderId)) {
      return false;
    }
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }

  protected validate(): void {
    if (!this.props.value || !OrderId.isValid(this.props.value)) {
      throw new Error('无效的订单ID');
    }
  }
} 