import { DomainEvent } from './DomainEvent';
import { EventStore } from './EventStore';
import { EventHandler, EventHandlerRegistry } from './EventHandler';

export interface EventBusConfig {
  enableEventStore?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  enableDeadLetterQueue?: boolean;
}

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private handlerRegistry: EventHandlerRegistry;
  private eventStore?: EventStore;
  private config: EventBusConfig;

  constructor(eventStore?: EventStore, config: EventBusConfig = {}) {
    this.eventStore = eventStore;
    this.handlerRegistry = new EventHandlerRegistry();
    this.config = {
      enableEventStore: true,
      retryAttempts: 3,
      retryDelay: 1000,
      enableDeadLetterQueue: false,
      ...config
    };
  }

  /**
   * 订阅事件
   */
  public subscribe<T extends DomainEvent>(eventType: string, handler: (event: T) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    // 创建包装器处理器
    const wrappedHandler: EventHandler = {
      name: `anonymous-${Date.now()}-${Math.random()}`,
      eventType,
      canHandle: (type: string) => type === eventType,
      handle: async (storedEvent) => {
        await handler(storedEvent.data as T);
      }
    };

    this.handlers.get(eventType)!.push(wrappedHandler);
    console.log(`已订阅事件: ${eventType}`);
  }

  /**
   * 注册事件处理器
   */
  public registerHandler(handler: EventHandler): void {
    this.handlerRegistry.register(handler);
    
    // 同时添加到本地处理器映射
    const eventType = handler.eventType;
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * 发布单个事件
   */
  public async publish<T extends DomainEvent>(event: T): Promise<void> {
    await this.publishAll([event]);
  }

  /**
   * 发布多个事件
   */
  public async publishAll(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    console.log(`发布 ${events.length} 个事件`);

    // 并行处理所有事件
    const publishPromises = events.map(event => this.processEvent(event));
    await Promise.all(publishPromises);

    console.log(`成功发布 ${events.length} 个事件`);
  }

  /**
   * 处理单个事件
   */
  private async processEvent(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    if (handlers.length === 0) {
      console.warn(`没有找到事件类型 ${eventType} 的处理器`);
      return;
    }

    console.log(`处理事件 ${eventType}, 找到 ${handlers.length} 个处理器`);

    // 转换为存储事件格式
    const storedEvent = {
      metadata: {
        eventId: `${Date.now()}-${Math.random()}`,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        occurredAt: event.occurredAt,
        correlationId: event.metadata?.correlationId,
        causationId: event.metadata?.causationId,
        userId: event.metadata?.userId
      },
      data: event
    };

    // 并行执行所有处理器
    const handlerPromises = handlers.map(handler => 
      this.executeHandler(handler, storedEvent)
    );

    try {
      await Promise.all(handlerPromises);
      console.log(`事件 ${eventType} 处理完成`);
    } catch (error) {
      console.error(`事件 ${eventType} 处理失败:`, error);
      throw error;
    }
  }

  /**
   * 执行单个处理器
   */
  private async executeHandler(handler: EventHandler, storedEvent: any): Promise<void> {
    let attempts = 0;
    const maxAttempts = this.config.retryAttempts || 3;

    while (attempts < maxAttempts) {
      try {
        console.log(`执行处理器 ${handler.name} (尝试 ${attempts + 1}/${maxAttempts})`);
        await handler.handle(storedEvent);
        console.log(`处理器 ${handler.name} 执行成功`);
        return;
      } catch (error) {
        attempts++;
        console.error(`处理器 ${handler.name} 执行失败 (尝试 ${attempts}/${maxAttempts}):`, error);

        if (attempts < maxAttempts) {
          // 等待后重试
          await this.delay(this.config.retryDelay || 1000);
        } else {
          // 最后一次失败
          console.error(`处理器 ${handler.name} 达到最大重试次数，放弃执行`);
          
          if (this.config.enableDeadLetterQueue) {
            await this.sendToDeadLetterQueue(handler, storedEvent, error as Error);
          }
          
          throw error;
        }
      }
    }
  }

  /**
   * 发送到死信队列
   */
  private async sendToDeadLetterQueue(handler: EventHandler, storedEvent: any, error: Error): Promise<void> {
    console.log(`发送事件到死信队列: ${storedEvent.metadata.eventType}, 处理器: ${handler.name}`);
    // 这里可以实现发送到死信队列的逻辑
    // 比如保存到数据库、发送到消息队列等
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重播聚合事件
   */
  public async replayAggregateEvents(aggregateId: string): Promise<void> {
    if (!this.eventStore) {
      throw new Error('事件存储未配置，无法重播事件');
    }

    console.log(`开始重播聚合 ${aggregateId} 的事件`);
    
    const storedEvents = await this.eventStore.getEventsForAggregate(aggregateId);
    
    for (const storedEvent of storedEvents) {
      const handlers = this.handlers.get(storedEvent.metadata.eventType) || [];
      
      for (const handler of handlers) {
        try {
          await handler.handle(storedEvent);
          console.log(`重播事件成功: ${storedEvent.metadata.eventType} -> ${handler.name}`);
        } catch (error) {
          console.error(`重播事件失败: ${storedEvent.metadata.eventType} -> ${handler.name}:`, error);
        }
      }
    }
    
    console.log(`聚合 ${aggregateId} 事件重播完成`);
  }

  /**
   * 按事件类型重播事件
   */
  public async replayEventsByType(eventType: string, fromTimestamp?: Date): Promise<void> {
    if (!this.eventStore) {
      throw new Error('事件存储未配置，无法重播事件');
    }

    console.log(`开始重播事件类型 ${eventType} 的事件`);
    
    const storedEvents = await this.eventStore.getEventsByType(eventType, fromTimestamp);
    const handlers = this.handlers.get(eventType) || [];
    
    if (handlers.length === 0) {
      console.warn(`没有找到事件类型 ${eventType} 的处理器`);
      return;
    }
    
    for (const storedEvent of storedEvents) {
      for (const handler of handlers) {
        try {
          await handler.handle(storedEvent);
          console.log(`重播事件成功: ${storedEvent.metadata.eventType} -> ${handler.name}`);
        } catch (error) {
          console.error(`重播事件失败: ${storedEvent.metadata.eventType} -> ${handler.name}:`, error);
        }
      }
    }
    
    console.log(`事件类型 ${eventType} 重播完成`);
  }

  /**
   * 获取统计信息
   */
  public getStats(): { 
    registeredEventTypes: string[]; 
    totalHandlers: number;
    handlersByType: Record<string, number>;
  } {
    const registeredEventTypes = Array.from(this.handlers.keys());
    const totalHandlers = Array.from(this.handlers.values())
      .reduce((total, handlers) => total + handlers.length, 0);
    
    const handlersByType: Record<string, number> = {};
    this.handlers.forEach((handlers, eventType) => {
      handlersByType[eventType] = handlers.length;
    });

    return {
      registeredEventTypes,
      totalHandlers,
      handlersByType
    };
  }

  /**
   * 清空所有处理器
   */
  public clear(): void {
    this.handlers.clear();
    this.handlerRegistry.clear();
    console.log('已清空所有事件处理器');
  }
} 