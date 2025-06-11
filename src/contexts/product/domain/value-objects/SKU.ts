import { ValueObject } from '../../../../shared/domain/ValueObject';

interface SKUProps {
  code: string;
}

export class SKU extends ValueObject<SKUProps> {
  constructor(code: string) {
    super({ code });
    this.validate();
  }

  private validate(): void {
    const { code } = this.props;

    if (!code || typeof code !== 'string') {
      throw new Error('SKU不能为空');
    }

    // SKU格式：字母数字组合，8-20位
    const skuRegex = /^[A-Za-z0-9]{8,20}$/;
    if (!skuRegex.test(code)) {
      throw new Error('SKU格式无效，必须是8-20位字母数字组合');
    }
  }

  public getCode(): string {
    return this.props.code;
  }

  public equals(other: SKU): boolean {
    if (!other) return false;
    return this.props.code === other.props.code;
  }

  public toString(): string {
    return this.props.code;
  }

  public static generate(): SKU {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const code = (timestamp + random).toUpperCase().substr(0, 12);
    return new SKU(code);
  }

  public toJSON() {
    return this.props.code;
  }
} 