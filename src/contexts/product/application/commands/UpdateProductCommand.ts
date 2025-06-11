import { injectable, inject } from 'inversify';
import { Command } from '../../../../shared/application/UseCase';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductId } from '../../domain/value-objects/ProductId';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { Price } from '../../domain/value-objects/Price';
import { ProductImage } from '../../domain/value-objects/ProductImage';
import { ProductStatus, Currency } from '../../domain/enums';
import { EventBus } from '../../../../shared/domain/EventBus';
import { TYPES } from '../../../../config/container';

export interface UpdateProductRequest {
  productId: string;
  name?: string;
  description?: string;
  price?: {
    amount: number;
    currency: Currency;
  };
  categoryId?: string;
  images?: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  status?: ProductStatus;
}

@injectable()
export class UpdateProductCommand implements Command<UpdateProductRequest> {
  constructor(
    @inject(TYPES.ProductRepository) private productRepository: ProductRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(request: UpdateProductRequest): Promise<void> {
    const productId = ProductId.fromString(request.productId);

    // 查找现有商品
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    // 更新商品信息
    if (request.name) {
      product.updateName(request.name);
    }

    if (request.description) {
      product.updateDescription(request.description);
    }

    if (request.price) {
      const newPrice = Price.create(request.price.amount, request.price.currency);
      product.updatePrice(newPrice);
    }

    if (request.categoryId) {
      const newCategoryId = CategoryId.fromString(request.categoryId);
      product.updateCategory(newCategoryId);
    }

    if (request.images) {
      const images = request.images.map(img => 
        ProductImage.create(img.url, img.alt, img.isPrimary)
      );
      product.updateImages(images);
    }

    if (request.status) {
      product.updateStatus(request.status);
    }

    // 保存商品
    await this.productRepository.save(product);

    // 发布领域事件
    await this.eventBus.publishAll(product.getUncommittedEvents());
    product.markEventsAsCommitted();
  }
} 