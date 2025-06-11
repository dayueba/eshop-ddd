import { injectable, inject } from 'inversify';
import { ProductRepository } from '../repositories/ProductRepository';
import { ProductId } from '../ProductId';
import { Product } from '../aggregates/Product';
import { TYPES } from '../../../../config/container';

export interface InventoryReservationItem {
  productId: ProductId;
  productName: string;
  requestedQuantity: number;
}

export interface InventoryValidationResult {
  isValid: boolean;
  invalidItems: Array<{
    productId: string;
    productName: string;
    requestedQuantity: number;
    availableQuantity: number;
    reason: string;
  }>;
}

/**
 * 库存管理领域服务
 * 处理跨聚合的库存相关业务逻辑，如库存验证、预留、释放等
 */
@injectable()
export class InventoryService {
  constructor(
    @inject(TYPES.ProductRepository) private productRepository: ProductRepository
  ) {}

  /**
   * 批量验证商品库存是否充足
   */
  async validateInventoryAvailability(items: InventoryReservationItem[]): Promise<InventoryValidationResult> {
    const invalidItems: Array<{
      productId: string;
      productName: string;
      requestedQuantity: number;
      availableQuantity: number;
      reason: string;
    }> = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      
      if (!product) {
        invalidItems.push({
          productId: item.productId.getValue(),
          productName: item.productName,
          requestedQuantity: item.requestedQuantity,
          availableQuantity: 0,
          reason: '商品不存在'
        });
        continue;
      }

      // 验证商品状态
      if (product.getStatus() !== 'ACTIVE') {
        invalidItems.push({
          productId: item.productId.getValue(),
          productName: item.productName,
          requestedQuantity: item.requestedQuantity,
          availableQuantity: 0,
          reason: '商品已下架'
        });
        continue;
      }

      // 验证库存
      const availableStock = product.getInventory().getAvailable();
      if (availableStock < item.requestedQuantity) {
        invalidItems.push({
          productId: item.productId.getValue(),
          productName: item.productName,
          requestedQuantity: item.requestedQuantity,
          availableQuantity: availableStock,
          reason: `库存不足，可用库存：${availableStock}，需要：${item.requestedQuantity}`
        });
      }
    }

    return {
      isValid: invalidItems.length === 0,
      invalidItems
    };
  }

  /**
   * 批量预留库存
   * 只有在所有商品都能成功预留的情况下才执行，否则回滚
   */
  async reserveInventoryBatch(items: InventoryReservationItem[]): Promise<Product[]> {
    // 首先验证所有商品的库存
    const validationResult = await this.validateInventoryAvailability(items);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.invalidItems.map(item => 
        `${item.productName}: ${item.reason}`
      );
      throw new Error(`库存验证失败：\n${errorMessages.join('\n')}`);
    }

    // 获取所有需要预留库存的商品
    const products: Product[] = [];
    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`商品 ${item.productName} 不存在`);
      }
      products.push(product);
    }

    // 执行库存预留
    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const item = items[i];
        product.reserveInventory(item.requestedQuantity);
      }

      // 批量保存
      for (const product of products) {
        await this.productRepository.save(product);
      }

      return products;
    } catch (error) {
      // 如果有任何失败，需要回滚已经预留的库存
      // 这里简化处理，实际项目中可能需要更复杂的事务处理
      throw new Error(`库存预留失败：${error.message}`);
    }
  }

  /**
   * 批量释放预留库存
   */
  async releaseReservedInventoryBatch(items: Array<{
    productId: ProductId;
    quantity: number;
  }>): Promise<void> {
    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        product.releaseInventory(item.quantity);
        await this.productRepository.save(product);
      }
    }
  }

  /**
   * 批量扣减库存（从预留库存中扣减）
   */
  async deductInventoryBatch(items: Array<{
    productId: ProductId;
    quantity: number;
  }>): Promise<void> {
    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        product.deductInventory(item.quantity);
        await this.productRepository.save(product);
      }
    }
  }

  /**
   * 检查商品是否可以被删除
   * 需要验证是否有未完成的订单等
   */
  async canDeleteProduct(productId: ProductId): Promise<boolean> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return false;
    }

    // 检查是否有预留库存
    if (product.getInventory().getReservedQuantity() > 0) {
      return false;
    }

    // 这里可以添加更多的业务规则检查
    // 例如：检查是否有活跃的订单、是否有进行中的促销等
    
    return true;
  }

  /**
   * 获取低库存商品列表
   */
  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const defaultThreshold = threshold || 10;
    
    // 这里需要在ProductRepository中添加相应的查询方法
    // 暂时简化实现
    const allProducts = await this.productRepository.findAll();
    return allProducts.filter(product => 
      product.getInventory().getAvailable() < defaultThreshold
    );
  }

  /**
   * 验证库存数据一致性
   */
  async validateInventoryConsistency(productId: ProductId): Promise<{
    isConsistent: boolean;
    issues: string[];
  }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return {
        isConsistent: false,
        issues: ['商品不存在']
      };
    }

    const issues: string[] = [];
    const inventory = product.getInventory();

    // 检查基本的数据一致性
    if (inventory.getReservedQuantity() > inventory.getQuantity()) {
      issues.push('预留库存超过总库存');
    }

    if (inventory.getQuantity() < 0) {
      issues.push('总库存不能为负数');
    }

    if (inventory.getReservedQuantity() < 0) {
      issues.push('预留库存不能为负数');
    }

    return {
      isConsistent: issues.length === 0,
      issues
    };
  }
} 