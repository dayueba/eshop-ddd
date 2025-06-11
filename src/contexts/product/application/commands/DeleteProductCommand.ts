import { injectable, inject } from 'inversify';
import { Command } from '../../../../shared/application/UseCase';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductId } from '../../domain/value-objects/ProductId';
import { EventBus } from '../../../../shared/domain/EventBus';
import { TYPES } from '../../../../config/container';

export interface DeleteProductRequest {
  productId: string;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

@injectable()
export class DeleteProductCommand implements Command<DeleteProductRequest, DeleteProductResponse> {
  constructor(
    @inject(TYPES.ProductRepository) private productRepository: ProductRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(request: DeleteProductRequest): Promise<DeleteProductResponse> {
    const productId = ProductId.fromString(request.productId);
    
    // 1. 检查商品是否存在
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    // 2. 检查商品是否可以删除（例如：有未完成的订单）
    // 这里可以添加业务规则检查
    // const hasActiveOrders = await this.orderService.hasActiveOrdersForProduct(productId);
    // if (hasActiveOrders) {
    //   throw new Error('商品存在活跃订单，无法删除');
    // }

    // 3. 软删除商品（更改状态为DELETED）
    product.delete();

    // 4. 保存商品
    await this.productRepository.save(product);

    // 5. 发布领域事件
    await this.eventBus.publishAll(product.getUncommittedEvents());
    product.markEventsAsCommitted();

    return {
      success: true,
      message: '商品删除成功'
    };
  }
} 