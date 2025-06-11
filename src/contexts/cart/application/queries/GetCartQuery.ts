import { injectable, inject } from 'inversify';
import { UseCase } from '../../../../shared/application/UseCase';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { UserId } from '../../../user/domain/value-objects/UserId';
import { TYPES } from '../../../../config/container';

interface GetCartRequest {
  userId: string;
}

interface CartItemDto {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  quantity: number;
  totalPrice: number;
  addedAt: Date;
}

interface GetCartResponse {
  cartId: string;
  userId: string;
  items: CartItemDto[];
  totalItemCount: number;
  totalPrice: number;
  currency: string;
  isEmpty: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class GetCartQuery implements UseCase<GetCartRequest, GetCartResponse | null> {
  constructor(
    @inject(TYPES.CartRepository) private readonly cartRepository: CartRepository
  ) {}

  public async execute(request: GetCartRequest): Promise<GetCartResponse | null> {
    try {
      // 验证输入
      this.validateRequest(request);

      // 创建值对象
      const userId = UserId.fromString(request.userId);

      // 获取购物车
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        return null;
      }

      // 转换为DTO
      const items: CartItemDto[] = cart.getItems().map(item => ({
        productId: item.getProductId().toString(),
        productName: item.getProductName(),
        price: item.getPrice().getAmount(),
        currency: item.getPrice().getCurrency(),
        quantity: item.getQuantity().getValue(),
        totalPrice: item.getTotalPrice().getAmount(),
        addedAt: item.getAddedAt()
      }));

      return {
        cartId: cart.getId().toString(),
        userId: cart.getUserId().toString(),
        items,
        totalItemCount: cart.getTotalItemCount(),
        totalPrice: cart.getTotalPrice().getAmount(),
        currency: cart.getTotalPrice().getCurrency(),
        isEmpty: cart.isEmpty(),
        createdAt: cart.getCreatedAt(),
        updatedAt: cart.getUpdatedAt()
      };
    } catch (error) {
      throw new Error(`获取购物车失败: ${error.message}`);
    }
  }

  private validateRequest(request: GetCartRequest): void {
    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('用户ID不能为空');
    }
  }
} 