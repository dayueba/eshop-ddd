import { injectable, inject } from 'inversify';
import { Command } from '../../../../shared/application/UseCase';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductId } from '../../domain/value-objects/ProductId';
import { InventoryService } from '../../domain/services/InventoryService';
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
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.InventoryService) private inventoryService: InventoryService
  ) {}

  public async execute(request: DeleteProductRequest): Promise<DeleteProductResponse> {
    const productId = ProductId.fromString(request.productId);
    
    // 1. 检查商品是否存在
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    // 2. 使用库存服务检查商品是否可以删除
    const canDelete = await this.inventoryService.canDeleteProduct(productId);
    if (!canDelete) {
      throw new Error('商品有预留库存或存在活跃订单，无法删除');
    }

    // 3. 验证库存数据一致性
    const consistencyResult = await this.inventoryService.validateInventoryConsistency(productId);
    if (!consistencyResult.isConsistent) {
      throw new Error(`商品库存数据异常，无法删除：${consistencyResult.issues.join('；')}`);
    }

    // 4. 软删除商品（更改状态为DELETED）
    product.delete();

    // 5. 保存商品
    await this.productRepository.save(product);

    // 6. 发布领域事件
    await this.eventBus.publishAll(product.getUncommittedEvents());
    product.markEventsAsCommitted();

    return {
      success: true,
      message: '商品删除成功'
    };
  }
} 