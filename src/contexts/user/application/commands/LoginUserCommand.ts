import { UseCase } from '@shared/application/UseCase';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Email } from '../../domain/value-objects/Email';
import { EventBus } from '@shared/infrastructure/EventBus';
import jwt from 'jsonwebtoken';
import { config } from '@config/environment';

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export class LoginUserCommand implements UseCase<LoginUserRequest, LoginUserResponse> {
  constructor(
    private userRepository: UserRepository,
    private eventBus: EventBus
  ) {}

  public async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // 创建邮箱值对象
    const email = new Email(request.email);

    // 查找用户
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('邮箱或密码不正确');
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(request.password);
    if (!isPasswordValid) {
      throw new Error('邮箱或密码不正确');
    }

    // 执行登录业务逻辑
    user.login();

    // 保存用户状态
    await this.userRepository.save(user);

    // 发布领域事件
    await this.eventBus.publishAll(user.getUncommittedEvents());
    user.markEventsAsCommitted();

    // 生成JWT令牌
    const accessToken = this.generateAccessToken(user.id, user.email.value, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email.value,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { userId, email, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }
} 