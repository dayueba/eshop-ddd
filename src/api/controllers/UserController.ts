import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { RegisterUserCommand, RegisterUserRequest } from '@contexts/user/application/commands/RegisterUserCommand';
import { LoginUserCommand, LoginUserRequest } from '@contexts/user/application/commands/LoginUserCommand';
import { UserRepository } from '@contexts/user/domain/repositories/UserRepository';
import { asyncHandler } from '../middleware/ErrorHandlerMiddleware';
import { TYPES } from '../../config/container';

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.RegisterUserCommand) private registerUserCommand: RegisterUserCommand,
    @inject(TYPES.LoginUserCommand) private loginUserCommand: LoginUserCommand
  ) {}

  public register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const registerRequest: RegisterUserRequest = {
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };

    await this.registerUserCommand.execute(registerRequest);

    res.status(201).json({
      success: true,
      message: '用户注册成功',
    });
  });

  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loginRequest: LoginUserRequest = {
      email: req.body.email,
      password: req.body.password,
    };

    const result = await this.loginUserCommand.execute(loginRequest);

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: result,
    });
  });

  public profile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // 从JWT中间件获取用户ID
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      throw new Error('未认证的用户');
    }

    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email.value,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          phone: user.profile.phone,
          addresses: user.profile.addresses.map(addr => addr.toPlainObject()),
        },
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  });
} 