import { UseCase } from '../../../../shared/application/UseCase';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { Product } from '../../domain/aggregates/Product';
import { ProductId } from '../../domain/value-objects/ProductId';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { Price } from '../../domain/value-objects/Price';
import { SKU } from '../../domain/value-objects/SKU';
import { Inventory } from '../../domain/value-objects/Inventory';
import { ProductImage } from '../../domain/value-objects/ProductImage';
import { ProductStatus } from '../../domain/enums';

interface CreateProductRequest {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  currency: string;
  sku?: string;
  inventory: number;
  images?: string[];
  specifications?: Record<string, any>;
}

interface CreateProductResponse {
  productId: string;
  name: string;
  sku: string;
  message: string;
}

export class CreateProductCommand implements UseCase<CreateProductRequest, CreateProductResponse> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  public async execute(request: CreateProductRequest): Promise<CreateProductResponse> {
    try {
      // 验证输入
      await this.validateRequest(request);

      // 创建值对象
      const productId = ProductId.create();
      const categoryId = CategoryId.fromString(request.categoryId);
      const price = Price.create(request.price, request.currency);
      const sku = request.sku ? SKU.fromString(request.sku) : SKU.generate();
      const inventory = Inventory.create(request.inventory);
      
      // 处理商品图片
      const images = request.images ? 
        request.images.map(url => ProductImage.create(url)) : [];

      // 检查SKU是否重复
      const existingProduct = await this.productRepository.findBySKU(sku);
      if (existingProduct) {
        throw new Error('SKU已存在，请使用不同的SKU');
      }

      // 验证分类存在
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new Error('指定的分类不存在');
      }

      // 创建商品
      const product = Product.create(
        productId,
        request.name,
        request.description,
        categoryId,
        price,
        sku,
        inventory,
        images,
        request.specifications
      );

      // 保存商品
      await this.productRepository.save(product);

      return {
        productId: productId.toString(),
        name: request.name,
        sku: sku.getValue(),
        message: '商品创建成功'
      };
    } catch (error) {
      throw new Error(`创建商品失败: ${error.message}`);
    }
  }

  private async validateRequest(request: CreateProductRequest): Promise<void> {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('商品名称不能为空');
    }
    if (request.name.length > 200) {
      throw new Error('商品名称不能超过200个字符');
    }
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('商品描述不能为空');
    }
    if (request.description.length > 2000) {
      throw new Error('商品描述不能超过2000个字符');
    }
    if (!request.categoryId || request.categoryId.trim().length === 0) {
      throw new Error('商品分类不能为空');
    }
    if (request.price <= 0) {
      throw new Error('商品价格必须大于0');
    }
    if (!request.currency || request.currency.trim().length === 0) {
      throw new Error('货币类型不能为空');
    }
    if (request.inventory < 0) {
      throw new Error('库存数量不能为负数');
    }
    if (request.images && request.images.length > 10) {
      throw new Error('商品图片不能超过10张');
    }
  }
} 