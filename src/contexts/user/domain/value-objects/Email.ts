import { ValueObject } from '@shared/domain/ValueObject';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(email: string) {
    super({ value: email });
    this.validate();
  }

  protected validate(): void {
    if (!this.props.value) {
      throw new Error('邮箱地址不能为空');
    }

    if (!Email.EMAIL_REGEX.test(this.props.value)) {
      throw new Error('邮箱地址格式不正确');
    }

    if (this.props.value.length > 254) {
      throw new Error('邮箱地址长度不能超过254个字符');
    }
  }

  get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
} 