# Repository接口改进 - MongoDB ID生成解决方案

## 问题背景

在DDD（领域驱动设计）中，实体应该在创建时就有唯一标识符，而不是依赖数据库在保存时生成ID。这样可以：

1. **保证实体一致性** - 实体从创建开始就有标识
2. **避免临时状态** - 不会出现"实体存在但没有ID"的情况
3. **支持更好的领域逻辑** - 可以在保存前就引用实体
4. **提高性能** - 可以预生成ID，支持批量操作

## 解决方案概述

我们通过以下方式改进了Repository模式：

### 1. ID生成器接口 (`IdGenerator`)

```typescript
export interface IdGenerator<T = string> {
  nextId(): T;
  isValid(id: T): boolean;
}
```

### 2. MongoDB专用实现

- **MongoObjectIdGenerator** - 使用MongoDB原生ObjectId
- **UUIDGenerator** - 使用标准UUID v4
- **IdGeneratorFactory** - 工厂方法选择合适的生成器

### 3. 改进的Repository接口

```typescript
export interface Repository<T, ID> {
  nextId(): ID;  // 新增：生成下一个唯一ID
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}
```

### 4. MongoDB Repository基类

提供了 `MongoRepository` 基类，自动集成ID生成功能。

## MongoDB ID生成策略对比

### ObjectId vs UUID

| 特性 | ObjectId | UUID v4 |
|------|----------|---------|
| 长度 | 12字节 (24字符hex) | 16字节 (36字符) |
| 包含时间戳 | ✅ 是 | ❌ 否 |
| MongoDB原生支持 | ✅ 完全支持 | ⚠️ 需要转换 |
| 跨数据库兼容性 | ❌ MongoDB专用 | ✅ 通用标准 |
| 索引性能 | ✅ 优秀 | ✅ 良好 |
| 可读性 | ⚠️ 较差 | ✅ 较好 |

### 推荐选择

- **使用ObjectId** - 如果确定使用MongoDB且看重性能
- **使用UUID** - 如果需要跨数据库兼容性或标准化

## 使用示例

### 1. 创建ID生成器

```typescript
// 使用ObjectId（推荐用于MongoDB）
const objectIdGenerator = new MongoObjectIdGenerator();

// 使用UUID（推荐用于跨数据库）
const uuidGenerator = new UUIDGenerator();

// 使用工厂方法
const generator = IdGeneratorFactory.createForMongo(true); // ObjectId
const generator2 = IdGeneratorFactory.createForMongo(false); // UUID
```

### 2. 实现Repository

```typescript
@injectable()
export class MongoOrderRepositoryV2 
  extends MongoRepository<Order, OrderId, OrderDocument> 
  implements OrderRepository {

  constructor() {
    super(
      model<OrderDocument>('Order', OrderSchema),
      {
        nextId: () => OrderId.create(),
        isValid: (id: OrderId) => OrderId.isValid(id.toString())
      }
    );
  }

  // 继承了基础的CRUD方法和nextId()方法
  // 只需要实现特定的业务查询方法
}
```

### 3. 在应用服务中使用

```typescript
async createOrder(data: CreateOrderData): Promise<OrderId> {
  // 1. 生成ID - 在创建实体之前
  const orderId = this.orderRepository.nextId();
  
  // 2. 创建实体（使用预生成的ID）
  const order = Order.create(
    orderId,  // 使用Repository生成的ID
    orderNumber,
    userId,
    items,
    totalAmount,
    shippingAddress
  );
  
  // 3. 保存实体（此时已经有ID）
  await this.orderRepository.save(order);
  
  return orderId;
}
```

### 4. 值对象改进

```typescript
export class OrderId extends ValueObject<OrderIdProps> {
  private static readonly idGenerator = IdGeneratorFactory.createForMongo();

  public static create(value?: string): OrderId {
    if (value) {
      return new OrderId(value);
    }
    return new OrderId(this.idGenerator.nextId());
  }

  public static isValid(value: string): boolean {
    return this.idGenerator.isValid(value);
  }
}
```

## 性能优势

### 1. 批量操作优化

```typescript
// 预生成所有ID
const orderIds = Array.from({length: 1000}, () => 
  orderRepository.nextId()
);

// 并行创建和保存（因为都有ID了）
const savePromises = orderIds.map(id => {
  const order = createOrder(id, ...data);
  return orderRepository.save(order);
});

await Promise.all(savePromises);
```

### 2. 避免数据库往返

- 不需要向数据库查询获取下一个ID
- 可以离线生成ID（ObjectId和UUID都支持）
- 减少数据库连接压力

## 迁移指南

### 从现有代码迁移

1. **更新Repository接口**
   ```typescript
   // 为现有Repository添加nextId方法
   class ExistingRepository implements Repository<Entity, EntityId> {
     private idGenerator = IdGeneratorFactory.createForMongo();
     
     nextId(): EntityId {
       return EntityId.create(this.idGenerator.nextId());
     }
     
     // ... 现有方法
   }
   ```

2. **更新值对象**
   ```typescript
   // 将现有的简单ID生成逻辑
   private static generateId(): string {
     return Date.now().toString() + Math.random().toString(36).substr(2, 9);
   }
   
   // 替换为标准的生成器
   private static readonly idGenerator = IdGeneratorFactory.createForMongo();
   
   public static create(value?: string): EntityId {
     return new EntityId(value || this.idGenerator.nextId());
   }
   ```

3. **更新应用服务**
   ```typescript
   // 修改创建实体的流程
   async createEntity(data: CreateData): Promise<EntityId> {
     const entityId = this.repository.nextId(); // 先生成ID
     const entity = Entity.create(entityId, ...data); // 使用预生成的ID
     await this.repository.save(entity);
     return entityId;
   }
   ```

## 最佳实践

1. **选择合适的ID生成策略**
   - MongoDB专用项目：使用ObjectId
   - 多数据库支持：使用UUID
   - 高性能要求：使用ObjectId

2. **ID验证**
   - 始终验证输入的ID格式
   - 在值对象构造函数中进行验证

3. **测试策略**
   - 为ID生成器编写单元测试
   - 测试ID的唯一性和有效性
   - 模拟ID生成器进行集成测试

4. **错误处理**
   - 处理ID生成失败的情况
   - 提供有意义的错误消息

## 注意事项

1. **向后兼容性**
   - 现有数据的ID格式可能不同
   - 需要支持多种ID格式的验证

2. **性能考虑**
   - ObjectId生成比UUID快
   - 考虑ID生成的频率和批量需求

3. **集群环境**
   - ObjectId和UUID都保证集群环境下的唯一性
   - 不需要额外的协调机制

通过这套解决方案，我们可以在MongoDB环境下完美实现DDD的ID生成最佳实践，同时保持代码的清晰性和可维护性。 