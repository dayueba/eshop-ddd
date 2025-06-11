import { EventBus, EventBusConfig } from '../shared/domain/EventBus';
import { EventStore } from '../shared/domain/EventStore';
import { MongoEventStore } from '../shared/infrastructure/MongoEventStore';
import { 
  SendWelcomeEmailHandler, 
  InitializeUserCartHandler, 
  UpdateUserStatsHandler 
} from '../shared/application/event-handlers/UserRegisteredEventHandler';

/**
 * 事件驱动架构配置
 */
export class EventDrivenConfig {
  private static instance: EventDrivenConfig;
  private eventStore: EventStore;
  private eventBus: EventBus;
  private initialized = false;

  private constructor() {
    // 初始化事件存储
    this.eventStore = new MongoEventStore();
    
    // 初始化事件总线
    const eventBusConfig: EventBusConfig = {
      enableEventStore: true,
      retryAttempts: 3,
      retryDelay: 1000,
      enableDeadLetterQueue: true
    };
    
    this.eventBus = new EventBus(this.eventStore, eventBusConfig);
  }

  public static getInstance(): EventDrivenConfig {
    if (!EventDrivenConfig.instance) {
      EventDrivenConfig.instance = new EventDrivenConfig();
    }
    return EventDrivenConfig.instance;
  }

  /**
   * 初始化事件驱动架构
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('事件驱动架构已经初始化过了');
      return;
    }

    console.log('🚀 正在初始化事件驱动架构...');

    try {
      // 注册事件处理器
      await this.registerEventHandlers();
      
      // 设置事件监听器
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ 事件驱动架构初始化完成');
      
      // 打印统计信息
      const stats = this.eventBus.getStats();
      console.log('📊 事件处理器统计:', {
        注册的事件类型: stats.registeredEventTypes,
        总处理器数量: stats.totalHandlers,
        各类型处理器数量: stats.handlersByType
      });
      
    } catch (error) {
      console.error('❌ 事件驱动架构初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册事件处理器
   */
  private async registerEventHandlers(): Promise<void> {
    console.log('📝 正在注册事件处理器...');

    // 用户注册相关事件处理器
    this.eventBus.registerHandler(new SendWelcomeEmailHandler());
    this.eventBus.registerHandler(new InitializeUserCartHandler());
    this.eventBus.registerHandler(new UpdateUserStatsHandler());

    // 可以在这里添加更多事件处理器
    // 例如：订单事件、商品事件等

    console.log('✅ 事件处理器注册完成');
  }

  /**
   * 设置事件监听器（使用回调函数方式）
   */
  private setupEventListeners(): void {
    console.log('🎧 正在设置事件监听器...');

    // 示例：直接订阅事件（非处理器类方式）
    this.eventBus.subscribe('UserLoggedIn', async (event: any) => {
      console.log(`用户登录事件处理: ${event.userId} 在 ${event.loginAt} 登录`);
      // 可以在这里添加登录相关的业务逻辑
    });

    // 可以添加更多订阅
    this.eventBus.subscribe('OrderCreated', async (event: any) => {
      console.log(`订单创建事件处理: 订单 ${event.orderId} 已创建`);
    });

    console.log('✅ 事件监听器设置完成');
  }

  /**
   * 获取事件总线实例
   */
  public getEventBus(): EventBus {
    if (!this.initialized) {
      throw new Error('事件驱动架构未初始化，请先调用 initialize() 方法');
    }
    return this.eventBus;
  }

  /**
   * 获取事件存储实例
   */
  public getEventStore(): EventStore {
    return this.eventStore;
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    initialized: boolean;
    eventStore: boolean;
    stats: any;
  }> {
    try {
      const stats = this.eventBus.getStats();
      
      // 检查事件存储连接（这里简化处理）
      let eventStoreHealthy = true;
      try {
        await this.eventStore.getEventStats();
      } catch (error) {
        eventStoreHealthy = false;
      }

      const isHealthy = this.initialized && eventStoreHealthy;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        initialized: this.initialized,
        eventStore: eventStoreHealthy,
        stats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        initialized: false,
        eventStore: false,
        stats: null
      };
    }
  }

  /**
   * 优雅关闭
   */
  public async shutdown(): Promise<void> {
    console.log('🔌 正在关闭事件驱动架构...');
    
    try {
      // 清空事件处理器
      this.eventBus.clear();
      
      this.initialized = false;
      console.log('✅ 事件驱动架构已关闭');
    } catch (error) {
      console.error('❌ 关闭事件驱动架构时出错:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const eventDrivenConfig = EventDrivenConfig.getInstance(); 