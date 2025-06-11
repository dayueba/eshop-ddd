import { Request, Response } from 'express';
import { asyncHandler } from '../src/api/middleware/ErrorHandlerMiddleware';
import { 
  ProductNotFoundError, 
  UserNotFoundError, 
  ValidationError,
  ErrorFactory 
} from '../src/api/middleware/CustomErrors';

/**
 * 重构后的控制器示例
 * 展示如何使用新的错误处理机制
 */
export class RefactoredControllerExample {

  // 示例1：使用 asyncHandler 包装，无需 try-catch
  public getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    
    // 直接抛出错误，中间件会自动处理状态码
    if (!userId) {
      throw new ValidationError('用户ID不能为空');
    }

    // 模拟查询用户
    const user = await this.findUserById(userId);
    
    if (!user) {
      // 使用自定义错误类，自动设置正确的状态码
      throw new UserNotFoundError(userId);
    }

    res.status(200).json({
      success: true,
      message: '获取用户成功',
      data: user
    });
  });

  // 示例2：使用错误工厂函数
  public getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const productId = req.params.id;
    
    if (!productId) {
      throw ErrorFactory.validation('商品ID不能为空');
    }

    const product = await this.findProductById(productId);
    
    if (!product) {
      throw ErrorFactory.productNotFound(productId);
    }

    res.status(200).json({
      success: true,
      message: '获取商品成功',
      data: product
    });
  });

  // 私有方法（模拟数据库操作）
  private async findUserById(userId: string) {
    return userId === 'user123' ? { id: userId, name: '测试用户' } : null;
  }

  private async findProductById(productId: string) {
    return productId === 'product123' 
      ? { id: productId, name: '测试商品', price: 100, stock: 10 } 
      : null;
  }
} 