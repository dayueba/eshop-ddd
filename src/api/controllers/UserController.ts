import { Request, Response } from 'express';
import { RegisterUserCommand, RegisterUserRequest } from '@contexts/user/application/commands/RegisterUserCommand';
import { LoginUserCommand, LoginUserRequest } from '@contexts/user/application/commands/LoginUserCommand';
import { MongoUserRepository } from '@contexts/user/infrastructure/repositories/MongoUserRepository';
import { InMemoryEventBus } from '@shared/infrastructure/EventBus';

export class UserController {
  private userRepository: MongoUserRepository;
  private eventBus: InMemoryEventBus;

  constructor() {
    this.userRepository = new MongoUserRepository();
    this.eventBus = new InMemoryEventBus();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerRequest: RegisterUserRequest = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      };

      const command = new RegisterUserCommand(this.userRepository, this.eventBus);
      await command.execute(registerRequest);

      res.status(201).json({
        success: true,
        message: '用户注册成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '注册失败',
      });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginRequest: LoginUserRequest = {
        email: req.body.email,
        password: req.body.password,
      };

      const command = new LoginUserCommand(this.userRepository, this.eventBus);
      const result = await command.execute(loginRequest);

      res.status(200).json({
        success: true,
        message: '登录成功',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : '登录失败',
      });
    }
  };

  public profile = async (req: Request, res: Response): Promise<void> => {
    try {
      // 从JWT中间件获取用户ID
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未认证的用户',
        });
        return;
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在',
        });
        return;
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取用户信息失败',
      });
    }
  };
} 