import { DomainEvent } from './DomainEvent';

export interface EventMetadata {
  eventId: string;
  aggregateId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: Date;
  correlationId?: string;
  causationId?: string;
  userId?: string;
}

export interface StoredEvent {
  metadata: EventMetadata;
  data: any;
}

export interface EventStream {
  aggregateId: string;
  events: StoredEvent[];
  version: number;
}

export interface EventStore {
  /**
   * 保存事件流
   */
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  
  /**
   * 获取聚合的事件流
   */
  getEventsForAggregate(aggregateId: string, fromVersion?: number): Promise<StoredEvent[]>;
  
  /**
   * 获取所有事件（用于投影和查询）
   */
  getAllEvents(fromTimestamp?: Date, eventTypes?: string[]): Promise<StoredEvent[]>;
  
  /**
   * 获取特定类型的事件
   */
  getEventsByType(eventType: string, fromTimestamp?: Date): Promise<StoredEvent[]>;
  
  /**
   * 获取聚合当前版本
   */
  getAggregateVersion(aggregateId: string): Promise<number>;
  
  /**
   * 检查事件是否存在
   */
  eventExists(eventId: string): Promise<boolean>;
} 