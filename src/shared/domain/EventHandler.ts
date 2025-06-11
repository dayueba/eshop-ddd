import { DomainEvent } from './DomainEvent';
import { StoredEvent } from './EventStore';

/**
 * 事件处理器接口
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * 事件处理器名称
   */
  readonly name: string;
  
  /**
   * 支持的事件类型
   */
  readonly eventType: string;
  
  /**
   * 处理事件
   */
  handle(event: StoredEvent): Promise<void>;
  
  /**
   * 检查是否可以处理该事件
   */
  canHandle(eventType: string): boolean;
}

/**
 * 抽象事件处理器基类
 */
export abstract class BaseEventHandler<T extends DomainEvent = DomainEvent> implements EventHandler<T> {
  public abstract readonly name: string;
  public abstract readonly eventType: string;

  public canHandle(eventType: string): boolean {
    return this.eventType === eventType;
  }

  public abstract handle(event: StoredEvent): Promise<void>;

  /**
   * 反序列化事件数据
   */
  protected deserializeEvent(event: StoredEvent): T {
    return event.data as T;
  }

  /**
   * 处理错误
   */
  protected handleError(error: Error, event: StoredEvent): void {
    console.error(`事件处理器 ${this.name} 处理事件失败:`, {
      eventId: event.metadata.eventId,
      eventType: event.metadata.eventType,
      aggregateId: event.metadata.aggregateId,
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * 事件处理器注册表
 */
export class EventHandlerRegistry {
  private handlers = new Map<string, EventHandler[]>();

  /**
   * 注册事件处理器
   */
  public register(handler: EventHandler): void {
    const eventType = handler.eventType;
    
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    const handlers = this.handlers.get(eventType)!;
    
    // 检查是否已经注册过相同名称的处理器
    const existingHandler = handlers.find(h => h.name === handler.name);
    if (existingHandler) {
      throw new Error(`事件处理器 ${handler.name} 已经注册过了`);
    }
    
    handlers.push(handler);
    console.log(`已注册事件处理器: ${handler.name} 处理事件类型: ${eventType}`);
  }

  /**
   * 获取指定事件类型的所有处理器
   */
  public getHandlers(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  /**
   * 获取所有已注册的事件类型
   */
  public getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 获取所有处理器
   */
  public getAllHandlers(): EventHandler[] {
    const allHandlers: EventHandler[] = [];
    this.handlers.forEach(handlers => {
      allHandlers.push(...handlers);
    });
    return allHandlers;
  }

  /**
   * 清空所有处理器
   */
  public clear(): void {
    this.handlers.clear();
  }
} 