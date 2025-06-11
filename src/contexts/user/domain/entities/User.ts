import { AggregateRoot } from '@shared/domain/AggregateRoot';
import { Email } from '../value-objects/Email';
import { Password } from '../value-objects/Password';
import { Address } from '../value-objects/Address';
import { UserRegisteredEvent } from '../events/UserRegisteredEvent';
import { UserLoggedInEvent } from '../events/UserLoggedInEvent';

export type UserId = string;

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  addresses: Address[];
}

interface UserProps {
  email: Email;
  password: Password;
  profile: UserProfile;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserId> {
  private props: UserProps;

  private constructor(id: UserId, props: UserProps) {
    super(id);
    this.props = props;
  }

  public static create(
    id: UserId,
    email: Email,
    password: Password,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.CUSTOMER
  ): User {
    const profile: UserProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      addresses: [],
    };

    const user = new User(id, {
      email,
      password,
      profile,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 添加用户注册事件
    user.addDomainEvent(new UserRegisteredEvent(id, email.value));

    return user;
  }

  public static reconstitute(
    id: UserId,
    email: Email,
    password: Password,
    profile: UserProfile,
    role: UserRole,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date
  ): User {
    return new User(id, {
      email,
      password,
      profile,
      role,
      isActive,
      createdAt,
      updatedAt,
    });
  }

  public async validatePassword(plainTextPassword: string): Promise<boolean> {
    return this.props.password.compare(plainTextPassword);
  }

  public login(): void {
    if (!this.props.isActive) {
      throw new Error('用户账户已被禁用');
    }

    // 添加用户登录事件
    this.addDomainEvent(new UserLoggedInEvent(this.id, this.props.email.value));
  }

  public updateProfile(
    firstName?: string,
    lastName?: string,
    phone?: string
  ): void {
    if (firstName !== undefined) {
      if (!firstName.trim()) {
        throw new Error('名字不能为空');
      }
      this.props.profile.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        throw new Error('姓氏不能为空');
      }
      this.props.profile.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
        throw new Error('手机号码格式不正确');
      }
      this.props.profile.phone = phone || undefined;
    }

    this.props.updatedAt = new Date();
  }

  public addAddress(address: Address): void {
    // 检查是否已存在相同地址
    const existingAddress = this.props.profile.addresses.find(addr =>
      addr.equals(address)
    );

    if (existingAddress) {
      throw new Error('该地址已存在');
    }

    this.props.profile.addresses.push(address);
    this.props.updatedAt = new Date();
  }

  public removeAddress(addressIndex: number): void {
    if (addressIndex < 0 || addressIndex >= this.props.profile.addresses.length) {
      throw new Error('地址索引无效');
    }

    this.props.profile.addresses.splice(addressIndex, 1);
    this.props.updatedAt = new Date();
  }

  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const isCurrentPasswordValid = await this.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('当前密码不正确');
    }

    this.props.password = await Password.create(newPassword);
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  // Getters
  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get profile(): UserProfile {
    return this.props.profile;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get fullName(): string {
    return `${this.props.profile.firstName} ${this.props.profile.lastName}`;
  }
} 