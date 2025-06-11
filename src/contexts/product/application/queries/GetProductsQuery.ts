import { injectable, inject } from 'inversify';
import { Query } from '../../../../shared/application/UseCase';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { ProductStatus } from '../../domain/enums';
import { TYPES } from '../../../../config/container';

export interface GetProductsRequest {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: {
    amount: number;
    currency: string;
  };
  categoryId: string;
  inventory: {
    total: number;
    available: number;
    reserved: number;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetProductsResponse {
  products: ProductDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@injectable()
export class GetProductsQuery implements Query<GetProductsRequest, GetProductsResponse> {
  constructor(
    @inject(TYPES.ProductRepository) private productRepository: ProductRepository
  ) {}

  public async execute(request: GetProductsRequest): Promise<GetProductsResponse> {
    const page = request.page || 1;
    const limit = Math.min(request.limit || 20, 100); // 最大限制100

    // 构建过滤条件
    const filters: any = {};
    
    if (request.categoryId) {
      filters.categoryId = CategoryId.fromString(request.categoryId);
    }
    
    if (request.status) {
      filters.status = request.status;
    }
    
    if (request.minPrice) {
      filters.minPrice = request.minPrice;
    }
    
    if (request.maxPrice) {
      filters.maxPrice = request.maxPrice;
    }
    
    if (request.searchTerm) {
      filters.searchTerm = request.searchTerm.trim();
    }

    // 获取分页数据
    const result = await this.productRepository.findWithPagination(
      page,
      limit,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    // 转换为DTO
    const products = result.products.map(product => this.toDTO(product));

    return {
      products,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  }

  private toDTO(product: any): ProductDTO {
    return {
      id: product.getId().toString(),
      name: product.getName(),
      description: product.getDescription(),
      sku: product.getSKU().getValue(),
      price: {
        amount: product.getPrice().getAmount(),
        currency: product.getPrice().getCurrency()
      },
      categoryId: product.getCategoryId().toString(),
      inventory: {
        total: product.getInventory().getTotal(),
        available: product.getInventory().getAvailable(),
        reserved: product.getInventory().getReserved()
      },
      images: product.getImages().map((img: any) => ({
        url: img.getUrl(),
        alt: img.getAlt(),
        isPrimary: img.isPrimary()
      })),
      status: product.getStatus(),
      createdAt: product.getCreatedAt(),
      updatedAt: product.getUpdatedAt()
    };
  }
} 