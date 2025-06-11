import { Model, Document } from 'mongoose';
import { Repository } from './Repository';
import { IdGenerator } from '../domain/IdGenerator';
import { IdGeneratorFactory } from './MongoIdGenerator';

/**
 * MongoDB Repository基类
 * 提供通用的MongoDB操作和ID生成功能
 */
export abstract class MongoRepository<T, ID, TDocument extends Document> 
  implements Repository<T, ID> {
  
  protected readonly model: Model<TDocument>;
  protected readonly idGenerator: IdGenerator<ID>;

  constructor(
    model: Model<TDocument>, 
    idGenerator?: IdGenerator<ID>
  ) {
    this.model = model;
    // 如果没有提供ID生成器，使用默认的MongoDB ObjectId生成器
    this.idGenerator = idGenerator || IdGeneratorFactory.createForMongo() as IdGenerator<ID>;
  }

  /**
   * 生成下一个唯一ID
   */
  nextId(): ID {
    return this.idGenerator.nextId();
  }

  /**
   * 根据ID查找实体
   */
  async findById(id: ID): Promise<T | null> {
    const document = await this.model.findById(id as any).exec();
    return document ? this.mapToEntity(document) : null;
  }

  /**
   * 保存实体
   */
  async save(entity: T): Promise<void> {
    const document = this.mapToDocument(entity);
    await document.save();
  }

  /**
   * 删除实体
   */
  async delete(id: ID): Promise<void> {
    await this.model.findByIdAndDelete(id as any).exec();
  }

  /**
   * 将文档映射为领域实体（子类实现）
   */
  protected abstract mapToEntity(document: TDocument): T;

  /**
   * 将领域实体映射为文档（子类实现）
   */
  protected abstract mapToDocument(entity: T): TDocument;
} 