import { injectable, inject } from 'inversify';
import { Command } from '@shared/application/UseCase';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { User, UserRole } from '../../domain/entities/User';
import { UserUniquenessService } from '../../domain/services/UserUniquenessService';
import { EventBus } from '@shared/infrastructure/EventBus';
import { TYPES } from '../../../../config/container';

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  phoneNumber?: string;
}

@injectable()
export class RegisterUserCommand implements Command<RegisterUserRequest> {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.UserUniquenessService) private userUniquenessService: UserUniquenessService
  ) {}

  public async execute(request: RegisterUserRequest): Promise<void> {
    // 1. 创建值对象
    const email = new Email(request.email);
    
    // 2. 验证邮箱域名是否被允许
    if (!this.userUniquenessService.isEmailDomainAllowed(email)) {
      throw new Error('不支持该邮箱域名注册');
    }

    // 3. 验证邮箱域名是否被阻止
    if (this.userUniquenessService.isEmailDomainBlocked(email)) {
      throw new Error('该邮箱域名已被禁止注册');
    }

    // 4. 使用领域服务验证用户信息的唯一性
    const uniquenessResult = await this.userUniquenessService.validateUserUniqueness({
      email,
      username: request.username,
      phoneNumber: request.phoneNumber
    });

    if (!uniquenessResult.isValid) {
      const errorMessages = uniquenessResult.conflicts.map(conflict => conflict.message);
      throw new Error(`注册失败：${errorMessages.join('；')}`);
    }

    // 5. 检查相似邮箱地址（防止误操作）
    const similarEmails = await this.userUniquenessService.findSimilarEmails(email);
    if (similarEmails.length > 0) {
      // 这里可以记录日志或发送提醒，但不阻止注册
      console.warn(`发现相似邮箱地址: ${similarEmails.map(e => e.value).join(', ')}`);
    }

    // 6. 创建密码
    const password = await Password.create(request.password);

    // 7. 生成用户ID
    const userId = this.generateUserId();

    // 8. 创建用户聚合
    const user = User.create(
      userId,
      email,
      password,
      request.firstName,
      request.lastName,
      UserRole.CUSTOMER,
      request.username,
      request.phoneNumber
    );

    // 9. 保存用户
    await this.userRepository.save(user);

    // 10. 发布领域事件
    await this.eventBus.publishAll(user.getUncommittedEvents());
    user.markEventsAsCommitted();
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 