import { injectable, inject } from 'inversify';
import { Command } from '@shared/application/UseCase';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { User, UserRole } from '../../domain/entities/User';
import { EventBus } from '@shared/infrastructure/EventBus';
import { TYPES } from '../../../../config/container';

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@injectable()
export class RegisterUserCommand implements Command<RegisterUserRequest> {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(request: RegisterUserRequest): Promise<void> {
    // 创建值对象
    const email = new Email(request.email);
    
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('该邮箱地址已被注册');
    }

    // 创建密码
    const password = await Password.create(request.password);

    // 生成用户ID
    const userId = this.generateUserId();

    // 创建用户聚合
    const user = User.create(
      userId,
      email,
      password,
      request.firstName,
      request.lastName,
      UserRole.CUSTOMER
    );

    // 保存用户
    await this.userRepository.save(user);

    // 发布领域事件
    await this.eventBus.publishAll(user.getUncommittedEvents());
    user.markEventsAsCommitted();
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 