import { UseCase } from '../../../../shared/application/UseCase';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { ProductId } from '../../../product/domain/value-objects/ProductId';
import { UserId } from '../../../user/domain/value-objects/UserId';

interface RemoveItemFromCartRequest {
  userId: string;
  productId: string;
}

interface RemoveItemFromCartResponse {
  success: boolean;
  message: string;
  cartItemCount: number;
  totalPrice: number;
}

export class RemoveItemFromCartCommand implements UseCase<RemoveItemFromCartRequest, RemoveItemFromCartResponse> {
  constructor(
    private readonly cartRepository: CartRepository
  ) {}

  public async execute(request: RemoveItemFromCartRequest): Promise<RemoveItemFromCartResponse> {
    try {
      // 验证输入
      this.validateRequest(request);

      // 创建值对象
      const userId = UserId.fromString(request.userId);
      const productId = ProductId.fromString(request.productId);

      // 获取购物车
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        throw new Error('购物车不存在');
      }

      // 移除商品
      cart.removeItem(productId);

      // 保存购物车
      await this.cartRepository.save(cart);

      return {
        success: true,
        message: '商品已从购物车移除',
        cartItemCount: cart.getTotalItemCount(),
        totalPrice: cart.getTotalPrice().getAmount()
      };
    } catch (error) {
      throw new Error(`移除商品失败: ${error.message}`);
    }
  }

  private validateRequest(request: RemoveItemFromCartRequest): void {
    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('用户ID不能为空');
    }
    if (!request.productId || request.productId.trim().length === 0) {
      throw new Error('商品ID不能为空');
    }
  }
} 