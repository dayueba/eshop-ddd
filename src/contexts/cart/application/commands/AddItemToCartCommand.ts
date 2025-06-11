import { UseCase } from '../../../../shared/application/UseCase';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { ProductId } from '../../../product/domain/value-objects/ProductId';
import { UserId } from '../../../user/domain/value-objects/UserId';
import { Quantity } from '../../domain/value-objects/Quantity';
import { Price } from '../../../product/domain/value-objects/Price';

interface AddItemToCartRequest {
  userId: string;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  quantity: number;
}

interface AddItemToCartResponse {
  success: boolean;
  message: string;
  cartItemCount: number;
  totalPrice: number;
}

export class AddItemToCartCommand implements UseCase<AddItemToCartRequest, AddItemToCartResponse> {
  constructor(
    private readonly cartRepository: CartRepository
  ) {}

  public async execute(request: AddItemToCartRequest): Promise<AddItemToCartResponse> {
    try {
      // 验证输入
      this.validateRequest(request);

      // 创建值对象
      const userId = UserId.fromString(request.userId);
      const productId = ProductId.fromString(request.productId);
      const price = Price.create(request.price, request.currency);
      const quantity = Quantity.create(request.quantity);

      // 获取或创建购物车
      const cart = await this.cartRepository.findOrCreateByUserId(userId);

      // 添加商品到购物车
      cart.addItem(productId, request.productName, price, quantity);

      // 保存购物车
      await this.cartRepository.save(cart);

      return {
        success: true,
        message: '商品已添加到购物车',
        cartItemCount: cart.getTotalItemCount(),
        totalPrice: cart.getTotalPrice().getAmount()
      };
    } catch (error) {
      throw new Error(`添加商品到购物车失败: ${error.message}`);
    }
  }

  private validateRequest(request: AddItemToCartRequest): void {
    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('用户ID不能为空');
    }
    if (!request.productId || request.productId.trim().length === 0) {
      throw new Error('商品ID不能为空');
    }
    if (!request.productName || request.productName.trim().length === 0) {
      throw new Error('商品名称不能为空');
    }
    if (request.price <= 0) {
      throw new Error('商品价格必须大于0');
    }
    if (!request.currency || request.currency.trim().length === 0) {
      throw new Error('货币类型不能为空');
    }
    if (request.quantity <= 0) {
      throw new Error('商品数量必须大于0');
    }
  }
} 