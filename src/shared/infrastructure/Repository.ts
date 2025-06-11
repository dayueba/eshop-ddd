export interface Repository<T, ID> {
  /**
   * 生成下一个唯一ID
   * 确保实体在保存前就有标识符，符合DDD设计原则
   */
  nextId(): ID;
  
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}

export interface QueryOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface QueryResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} 