# 控制器错误处理重构指南

## 问题背景

项目中每个控制器方法都包含重复的 try-catch 代码，这导致：
- 代码冗余，每个方法都有相似的错误处理逻辑
- 维护困难，错误处理逻辑分散在各个方法中
- 不一致的错误响应格式
- 难以统一修改错误处理策略

## 解决方案

使用统一的错误处理中间件 `ErrorHandlerMiddleware` 和异步错误包装器 `asyncHandler`。

## 重构步骤

### 1. 导入错误处理中间件

在控制器文件中导入 `asyncHandler`：

```typescript
import { asyncHandler } from '../middleware/ErrorHandlerMiddleware';
```

### 2. 重构前的代码模式

```typescript
// 重构前：每个方法都有重复的 try-catch
public createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CreateProductRequest = req.body;
    await this.createProductCommand.execute(request);

    res.status(201).json({
      success: true,
      message: '商品创建成功'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '创建商品失败'
    });
  }
};
```

### 3. 重构后的代码模式

```typescript
// 重构后：使用 asyncHandler 包装，无需 try-catch
public createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const request: CreateProductRequest = req.body;
  await this.createProductCommand.execute(request);

  res.status(201).json({
    success: true,
    message: '商品创建成功'
  });
});
```

### 4. 错误抛出模式

对于需要特定状态码的错误，直接抛出错误即可：

```typescript
// 重构前：手动设置状态码
public getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const request: GetProductByIdRequest = {
      productId: req.params.id
    };

    const response = await this.getProductByIdQuery.execute(request);

    res.status(200).json({
      success: true,
      message: '获取商品详情成功',
      data: response
    });
  } catch (error: any) {
    if (error.message === '商品不存在') {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || '获取商品详情失败'
    });
  }
};

// 重构后：直接抛出错误，中间件会自动处理状态码
public getProductById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const request: GetProductByIdRequest = {
    productId: req.params.id
  };

  const response = await this.getProductByIdQuery.execute(request);

  res.status(200).json({
    success: true,
    message: '获取商品详情成功',
    data: response
  });
});
```

## 错误处理中间件的优势

### 1. 自动错误分类

中间件会根据错误消息自动判断错误类型并设置合适的状态码：

- **400 Bad Request**: 验证错误、格式错误、参数错误
- **401 Unauthorized**: 认证错误、令牌错误
- **403 Forbidden**: 权限不足
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突、重复
- **500 Internal Server Error**: 其他未分类错误

### 2. 统一错误响应格式

```typescript
{
  "success": false,
  "message": "错误信息",
  "type": "ErrorType"
}
```

### 3. 详细错误日志

中间件会自动记录详细的错误信息：

```typescript
console.error('错误详情:', {
  message: error.message,
  stack: error.stack,
  url: req.originalUrl,
  method: req.method,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});
```

## 批量重构示例

### ProductController 重构示例

```typescript
// 所有方法都使用 asyncHandler 包装
export class ProductController {
  public createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const request: CreateProductRequest = req.body;
    await this.createProductCommand.execute(request);
    
    res.status(201).json({
      success: true,
      message: '商品创建成功'
    });
  });

  public updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const request: UpdateProductRequest = {
      productId: req.params.id,
      ...req.body
    };
    
    await this.updateProductCommand.execute(request);
    
    res.status(200).json({
      success: true,
      message: '商品更新成功'
    });
  });

  public getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const request: GetProductsRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      categoryId: req.query.categoryId as string,
      status: req.query.status as any,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      searchTerm: req.query.search as string
    };

    const response = await this.getProductsQuery.execute(request);

    res.status(200).json({
      success: true,
      message: '获取商品列表成功',
      data: response
    });
  });
}
```

## 注意事项

### 1. 保持错误消息的语义化

确保抛出的错误消息能被中间件正确分类：

```typescript
// 好的做法
throw new Error('用户不存在');        // 自动识别为 404
throw new Error('权限不足');          // 自动识别为 403
throw new Error('邮箱已存在');        // 自动识别为 409
throw new Error('密码格式不正确');    // 自动识别为 400

// 不好的做法
throw new Error('error123');         // 无法正确分类，默认为 500
```

### 2. 自定义错误类

如果需要更精确的错误控制，可以创建自定义错误类：

```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 使用
throw new NotFoundError('商品不存在');
throw new ValidationError('邮箱格式不正确');
```

### 3. 渐进式重构

建议分步重构：

1. 先重构一个控制器，测试功能正常
2. 逐步重构其他控制器
3. 最后移除旧的错误处理代码

## 重构检查清单

- [ ] 已导入 `asyncHandler`
- [ ] 所有异步方法都使用 `asyncHandler` 包装
- [ ] 移除了方法内的 try-catch 块
- [ ] 将错误响应逻辑改为直接抛出错误
- [ ] 确保错误消息语义化，便于中间件分类
- [ ] 测试各种错误场景，确保状态码正确
- [ ] 验证错误响应格式一致

## 预期效果

重构完成后：

- 控制器代码减少约 30-50%
- 错误处理逻辑统一且易于维护
- 错误响应格式一致
- 更好的错误日志记录
- 更容易添加新的错误处理规则 