import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { IdGenerator } from '../domain/IdGenerator';

/**
 * MongoDB ObjectId生成器
 * 使用MongoDB原生的ObjectId，在客户端生成，无需连接数据库
 */
export class MongoObjectIdGenerator implements IdGenerator<string> {
  nextId(): string {
    return new ObjectId().toHexString();
  }

  isValid(id: string): boolean {
    return ObjectId.isValid(id);
  }
}

/**
 * UUID生成器
 * 使用标准UUID v4，更通用的解决方案，可跨不同数据库使用
 */
export class UUIDGenerator implements IdGenerator<string> {
  nextId(): string {
    return randomUUID();
  }

  isValid(id: string): boolean {
    // UUID v4 正则表达式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}

/**
 * 工厂方法：根据配置创建适合的ID生成器
 */
export class IdGeneratorFactory {
  static createForMongo(useObjectId: boolean = true): IdGenerator<string> {
    return useObjectId ? new MongoObjectIdGenerator() : new UUIDGenerator();
  }
} 