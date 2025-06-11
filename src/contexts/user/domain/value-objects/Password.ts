import { ValueObject } from '@shared/domain/ValueObject';
import bcrypt from 'bcryptjs';

interface PasswordProps {
  hashedValue: string;
}

export class Password extends ValueObject<PasswordProps> {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly SALT_ROUNDS = 12;

  constructor(hashedPassword: string) {
    super({ hashedValue: hashedPassword });
    this.validate();
  }

  protected validate(): void {
    if (!this.props.hashedValue) {
      throw new Error('密码不能为空');
    }
  }

  public static async create(plainTextPassword: string): Promise<Password> {
    if (!plainTextPassword) {
      throw new Error('密码不能为空');
    }

    if (plainTextPassword.length < Password.MIN_LENGTH) {
      throw new Error(`密码长度不能少于${Password.MIN_LENGTH}个字符`);
    }

    if (plainTextPassword.length > Password.MAX_LENGTH) {
      throw new Error(`密码长度不能超过${Password.MAX_LENGTH}个字符`);
    }

    // 检查密码复杂度
    if (!Password.isComplexEnough(plainTextPassword)) {
      throw new Error('密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符');
    }

    const hashedPassword = await bcrypt.hash(plainTextPassword, Password.SALT_ROUNDS);
    return new Password(hashedPassword);
  }

  public async compare(plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, this.props.hashedValue);
  }

  private static isComplexEnough(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
  }

  get value(): string {
    return this.props.hashedValue;
  }
} 