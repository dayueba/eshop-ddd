import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { EventStore, EventMetadata, StoredEvent } from '../domain/EventStore';
import { DomainEvent } from '../domain/DomainEvent';

// 事件文档接口
interface EventDocument extends Document {
  eventId: string;
  aggregateId: string;
  eventType: string;
  eventVersion: number;
  data: any;
  metadata: {
    occurredAt: Date;
    correlationId?: string;
    causationId?: string;
    userId?: string;
  };
  createdAt: Date;
}

// 聚合版本文档接口
interface AggregateVersionDocument extends Document {
  aggregateId: string;
  version: number;
  updatedAt: Date;
}

// 事件Schema
const EventSchema = new Schema<EventDocument>({
  eventId: { type: String, required: true, unique: true, index: true },
  aggregateId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true },
  eventVersion: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  metadata: {
    occurredAt: { type: Date, required: true, index: true },
    correlationId: { type: String, index: true },
    causationId: { type: String, index: true },
    userId: { type: String, index: true }
  },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  versionKey: false,
  collection: 'events'
});

// 聚合版本Schema
const AggregateVersionSchema = new Schema<AggregateVersionDocument>({
  aggregateId: { type: String, required: true, unique: true, index: true },
  version: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, {
  versionKey: false,
  collection: 'aggregate_versions'
});

// 复合索引
EventSchema.index({ aggregateId: 1, eventVersion: 1 }, { unique: true });
EventSchema.index({ eventType: 1, 'metadata.occurredAt': 1 });
EventSchema.index({ 'metadata.occurredAt': 1 });

const EventModel = model<EventDocument>('Event', EventSchema);
const AggregateVersionModel = model<AggregateVersionDocument>('AggregateVersion', AggregateVersionSchema);

export class MongoEventStore implements EventStore {
  
  async saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const session = await EventModel.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 检查并发冲突
        const currentVersion = await this.getAggregateVersion(aggregateId);
        if (currentVersion !== expectedVersion) {
          throw new Error(`并发冲突: 期望版本 ${expectedVersion}, 实际版本 ${currentVersion}`);
        }

        // 转换为存储格式
        const eventDocuments = events.map((event, index) => ({
          eventId: uuidv4(),
          aggregateId,
          eventType: event.eventType,
          eventVersion: expectedVersion + index + 1,
          data: this.serializeEventData(event),
          metadata: {
            occurredAt: event.occurredAt,
            correlationId: event.metadata?.correlationId,
            causationId: event.metadata?.causationId,
            userId: event.metadata?.userId
          }
        }));

        // 保存事件
        await EventModel.insertMany(eventDocuments, { session });

        // 更新聚合版本
        const newVersion = expectedVersion + events.length;
        await AggregateVersionModel.findOneAndUpdate(
          { aggregateId },
          { 
            version: newVersion, 
            updatedAt: new Date() 
          },
          { 
            upsert: true, 
            session,
            new: true 
          }
        );
      });
    } catch (error) {
      console.error('保存事件失败:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getEventsForAggregate(aggregateId: string, fromVersion?: number): Promise<StoredEvent[]> {
    const query: any = { aggregateId };
    
    if (fromVersion !== undefined) {
      query.eventVersion = { $gte: fromVersion };
    }

    const eventDocs = await EventModel
      .find(query)
      .sort({ eventVersion: 1 })
      .lean();

    return eventDocs.map(doc => this.mapToStoredEvent(doc));
  }

  async getAllEvents(fromTimestamp?: Date, eventTypes?: string[]): Promise<StoredEvent[]> {
    const query: any = {};
    
    if (fromTimestamp) {
      query['metadata.occurredAt'] = { $gte: fromTimestamp };
    }
    
    if (eventTypes && eventTypes.length > 0) {
      query.eventType = { $in: eventTypes };
    }

    const eventDocs = await EventModel
      .find(query)
      .sort({ 'metadata.occurredAt': 1, eventVersion: 1 })
      .lean();

    return eventDocs.map(doc => this.mapToStoredEvent(doc));
  }

  async getEventsByType(eventType: string, fromTimestamp?: Date): Promise<StoredEvent[]> {
    const query: any = { eventType };
    
    if (fromTimestamp) {
      query['metadata.occurredAt'] = { $gte: fromTimestamp };
    }

    const eventDocs = await EventModel
      .find(query)
      .sort({ 'metadata.occurredAt': 1 })
      .lean();

    return eventDocs.map(doc => this.mapToStoredEvent(doc));
  }

  async getAggregateVersion(aggregateId: string): Promise<number> {
    const versionDoc = await AggregateVersionModel
      .findOne({ aggregateId })
      .lean();
    
    return versionDoc?.version || 0;
  }

  async eventExists(eventId: string): Promise<boolean> {
    const count = await EventModel.countDocuments({ eventId });
    return count > 0;
  }

  /**
   * 获取事件统计信息
   */
  async getEventStats(): Promise<{ totalEvents: number; eventTypes: string[]; latestEvent?: Date }> {
    const totalEvents = await EventModel.countDocuments();
    
    const eventTypes = await EventModel.distinct('eventType');
    
    const latestEventDoc = await EventModel
      .findOne()
      .sort({ 'metadata.occurredAt': -1 })
      .select('metadata.occurredAt')
      .lean();

    return {
      totalEvents,
      eventTypes,
      latestEvent: latestEventDoc?.metadata.occurredAt
    };
  }

  /**
   * 重播事件（用于调试和数据修复）
   */
  async replayEvents(aggregateId: string): Promise<StoredEvent[]> {
    return this.getEventsForAggregate(aggregateId);
  }

  /**
   * 序列化事件数据
   */
  private serializeEventData(event: DomainEvent): any {
    const { eventType, occurredAt, aggregateId, eventVersion, metadata, ...data } = event;
    return data;
  }

  /**
   * 映射到存储事件
   */
  private mapToStoredEvent(doc: any): StoredEvent {
    return {
      metadata: {
        eventId: doc.eventId,
        aggregateId: doc.aggregateId,
        eventType: doc.eventType,
        eventVersion: doc.eventVersion,
        occurredAt: doc.metadata.occurredAt,
        correlationId: doc.metadata.correlationId,
        causationId: doc.metadata.causationId,
        userId: doc.metadata.userId
      },
      data: {
        ...doc.data,
        eventType: doc.eventType,
        occurredAt: doc.metadata.occurredAt,
        aggregateId: doc.aggregateId,
        eventVersion: doc.eventVersion
      }
    };
  }
}