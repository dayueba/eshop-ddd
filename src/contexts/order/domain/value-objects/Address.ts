import { ValueObject } from '../../../../shared/domain/ValueObject';

interface AddressProps {
  country: string;
  province: string;
  city: string;
  district: string;
  street: string;
  zipCode: string;
  contactName: string;
  contactPhone: string;
}

export class Address extends ValueObject<AddressProps> {
  constructor(
    country: string,
    province: string,
    city: string,
    district: string,
    street: string,
    zipCode: string,
    contactName: string,
    contactPhone: string
  ) {
    super({
      country,
      province,
      city,
      district,
      street,
      zipCode,
      contactName,
      contactPhone
    });
    this.validate();
  }

  private validate(): void {
    if (!this.props.country || this.props.country.trim().length === 0) {
      throw new Error('国家不能为空');
    }

    if (!this.props.province || this.props.province.trim().length === 0) {
      throw new Error('省份不能为空');
    }

    if (!this.props.city || this.props.city.trim().length === 0) {
      throw new Error('城市不能为空');
    }

    if (!this.props.district || this.props.district.trim().length === 0) {
      throw new Error('区县不能为空');
    }

    if (!this.props.street || this.props.street.trim().length === 0) {
      throw new Error('街道地址不能为空');
    }

    if (!this.props.contactName || this.props.contactName.trim().length === 0) {
      throw new Error('联系人姓名不能为空');
    }

    if (!this.props.contactPhone || this.props.contactPhone.trim().length === 0) {
      throw new Error('联系电话不能为空');
    }

    // 验证电话号码格式（简单验证）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(this.props.contactPhone)) {
      throw new Error('联系电话格式无效');
    }

    // 验证邮编格式（6位数字）
    if (this.props.zipCode) {
      const zipCodeRegex = /^\d{6}$/;
      if (!zipCodeRegex.test(this.props.zipCode)) {
        throw new Error('邮编格式无效');
      }
    }
  }

  // Getters
  public getCountry(): string {
    return this.props.country;
  }

  public getProvince(): string {
    return this.props.province;
  }

  public getCity(): string {
    return this.props.city;
  }

  public getDistrict(): string {
    return this.props.district;
  }

  public getStreet(): string {
    return this.props.street;
  }

  public getZipCode(): string {
    return this.props.zipCode;
  }

  public getContactName(): string {
    return this.props.contactName;
  }

  public getContactPhone(): string {
    return this.props.contactPhone;
  }

  // 业务方法
  public getFullAddress(): string {
    return `${this.props.country}${this.props.province}${this.props.city}${this.props.district}${this.props.street}`;
  }

  public getFormattedAddress(): string {
    const parts = [
      this.props.country,
      this.props.province,
      this.props.city,
      this.props.district,
      this.props.street
    ];
    return parts.join(' ');
  }

  public updateContactInfo(contactName: string, contactPhone: string): Address {
    return new Address(
      this.props.country,
      this.props.province,
      this.props.city,
      this.props.district,
      this.props.street,
      this.props.zipCode,
      contactName,
      contactPhone
    );
  }

  public equals(other: Address): boolean {
    if (!other) return false;
    return this.props.country === other.props.country &&
           this.props.province === other.props.province &&
           this.props.city === other.props.city &&
           this.props.district === other.props.district &&
           this.props.street === other.props.street &&
           this.props.zipCode === other.props.zipCode &&
           this.props.contactName === other.props.contactName &&
           this.props.contactPhone === other.props.contactPhone;
  }

  public toJSON() {
    return {
      country: this.props.country,
      province: this.props.province,
      city: this.props.city,
      district: this.props.district,
      street: this.props.street,
      zipCode: this.props.zipCode,
      contactName: this.props.contactName,
      contactPhone: this.props.contactPhone,
      fullAddress: this.getFullAddress(),
      formattedAddress: this.getFormattedAddress()
    };
  }
} 