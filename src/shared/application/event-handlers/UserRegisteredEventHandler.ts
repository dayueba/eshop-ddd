import { BaseEventHandler } from '../../domain/EventHandler';
import { StoredEvent } from '../../domain/EventStore';

export interface UserRegisteredEventData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  registeredAt: Date;
}

/**
 * 用户注册事件处理器 - 发送欢迎邮件
 */
export class SendWelcomeEmailHandler extends BaseEventHandler {
  public readonly name = 'SendWelcomeEmailHandler';
  public readonly eventType = 'UserRegistered';

  public async handle(event: StoredEvent): Promise<void> {
    try {
      const eventData = this.deserializeEvent(event) as UserRegisteredEventData;
      
      console.log(`发送欢迎邮件给用户: ${eventData.email}`);
      
      // 模拟发送邮件
      await this.sendWelcomeEmail(eventData);
      
      console.log(`欢迎邮件发送成功: ${eventData.email}`);
    } catch (error) {
      this.handleError(error as Error, event);
      throw error;
    }
  }

  private async sendWelcomeEmail(userData: UserRegisteredEventData): Promise<void> {
    // 模拟邮件发送延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 这里可以集成真实的邮件服务
    console.log(`📧 欢迎邮件内容:
      收件人: ${userData.email}
      姓名: ${userData.firstName} ${userData.lastName}
      注册时间: ${userData.registeredAt.toISOString()}
      内容: 欢迎加入我们的电商平台！
    `);
  }
}

/**
 * 用户注册事件处理器 - 初始化用户购物车
 */
export class InitializeUserCartHandler extends BaseEventHandler {
  public readonly name = 'InitializeUserCartHandler';
  public readonly eventType = 'UserRegistered';

  public async handle(event: StoredEvent): Promise<void> {
    try {
      const eventData = this.deserializeEvent(event) as UserRegisteredEventData;
      
      console.log(`为用户初始化购物车: ${eventData.userId}`);
      
      // 模拟创建购物车
      await this.createUserCart(eventData.userId);
      
      console.log(`用户购物车初始化完成: ${eventData.userId}`);
    } catch (error) {
      this.handleError(error as Error, event);
      throw error;
    }
  }

  private async createUserCart(userId: string): Promise<void> {
    // 模拟购物车创建
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`🛒 为用户 ${userId} 创建了新的购物车`);
  }
}

/**
 * 用户注册事件处理器 - 用户统计
 */
export class UpdateUserStatsHandler extends BaseEventHandler {
  public readonly name = 'UpdateUserStatsHandler';
  public readonly eventType = 'UserRegistered';

  public async handle(event: StoredEvent): Promise<void> {
    try {
      const eventData = this.deserializeEvent(event) as UserRegisteredEventData;
      
      console.log(`更新用户统计信息`);
      
      // 模拟更新统计
      await this.updateRegistrationStats(eventData);
      
      console.log(`用户统计信息更新完成`);
    } catch (error) {
      this.handleError(error as Error, event);
      throw error;
    }
  }

  private async updateRegistrationStats(userData: UserRegisteredEventData): Promise<void> {
    // 模拟统计更新
    await new Promise(resolve => setTimeout(resolve, 30));
    
    console.log(`📊 用户注册统计已更新:
      新用户: ${userData.email}
      注册时间: ${userData.registeredAt}
      总注册用户数: +1
    `);
  }
} 