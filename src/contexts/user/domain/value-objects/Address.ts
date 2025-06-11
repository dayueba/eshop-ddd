import { ValueObject } from '@shared/domain/ValueObject';

interface AddressProps {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class Address extends ValueObject<AddressProps> {
  constructor(props: AddressProps) {
    super(props);
    this.validate();
  }

  protected validate(): void {
    if (!this.props.street?.trim()) {
      throw new Error('街道地址不能为空');
    }

    if (!this.props.city?.trim()) {
      throw new Error('城市不能为空');
    }

    if (!this.props.state?.trim()) {
      throw new Error('省份/州不能为空');
    }

    if (!this.props.zipCode?.trim()) {
      throw new Error('邮政编码不能为空');
    }

    if (!this.props.country?.trim()) {
      throw new Error('国家不能为空');
    }

    // 验证邮政编码格式（中国邮政编码）
    if (this.props.country === '中国' && !/^\d{6}$/.test(this.props.zipCode)) {
      throw new Error('中国邮政编码必须是6位数字');
    }

    // 验证字段长度
    if (this.props.street.length > 200) {
      throw new Error('街道地址长度不能超过200个字符');
    }

    if (this.props.city.length > 50) {
      throw new Error('城市名称长度不能超过50个字符');
    }

    if (this.props.state.length > 50) {
      throw new Error('省份/州名称长度不能超过50个字符');
    }
  }

  get street(): string {
    return this.props.street;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get zipCode(): string {
    return this.props.zipCode;
  }

  get country(): string {
    return this.props.country;
  }

  public getFullAddress(): string {
    return `${this.props.street}, ${this.props.city}, ${this.props.state} ${this.props.zipCode}, ${this.props.country}`;
  }

  public toPlainObject(): AddressProps {
    return {
      street: this.props.street,
      city: this.props.city,
      state: this.props.state,
      zipCode: this.props.zipCode,
      country: this.props.country,
    };
  }
} 