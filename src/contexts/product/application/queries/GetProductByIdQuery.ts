import { UseCase } from '../../../../shared/application/UseCase';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductId } from '../../domain/value-objects/ProductId';
import { ProductStatus } from '../../domain/enums';

interface GetProductByIdRequest {
  productId: string;
}

interface ProductDetailDto {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: {
    amount: number;
    currency: string;
  };
  sku: string;
  status: ProductStatus;
  inventory: {
    total: number;
    available: number;
    reserved: number;
  };
  images: string[];
  specifications: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class GetProductByIdQuery implements UseCase<GetProductByIdRequest, ProductDetailDto | null> {
  constructor(
    private readonly productRepository: ProductRepository
  ) {}

  public async execute(request: GetProductByIdRequest): Promise<ProductDetailDto | null> {
    try {
      // 验证输入
      this.validateRequest(request);

      // 创建值对象
      const productId = ProductId.fromString(request.productId);

      // 查询商品
      const product = await this.productRepository.findById(productId);
      if (!product) {
        return null;
      }

      // 转换为DTO
      return {
        id: product.getId().toString(),
        name: product.getName(),
        description: product.getDescription(),
        categoryId: product.getCategoryId().toString(),
        price: {
          amount: product.getPrice().getAmount(),
          currency: product.getPrice().getCurrency()
        },
        sku: product.getSKU().getValue(),
        status: product.getStatus(),
        inventory: {
          total: product.getInventory().getTotal(),
          available: product.getInventory().getAvailable(),
          reserved: product.getInventory().getReserved()
        },
        images: product.getImages().map(img => img.getUrl()),
        specifications: product.getSpecifications(),
        createdAt: product.getCreatedAt(),
        updatedAt: product.getUpdatedAt()
      };
    } catch (error) {
      throw new Error(`获取商品详情失败: ${error.message}`);
    }
  }

  private validateRequest(request: GetProductByIdRequest): void {
    if (!request.productId || request.productId.trim().length === 0) {
      throw new Error('商品ID不能为空');
    }
  }
} 