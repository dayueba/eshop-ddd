import { Repository } from '../../../../shared/domain/Repository';
import { Product } from '../aggregates/Product';
import { ProductId } from '../ProductId';
import { CategoryId } from '../CategoryId';
import { SKU } from '../value-objects/SKU';
import { ProductStatus } from '../enums';

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductSearchCriteria {
  keyword?: string;
  categoryId?: CategoryId;
  priceRange?: { min: number; max: number };
  status?: ProductStatus[];
  inStock?: boolean;
}

export interface ProductRepository extends Repository<Product, ProductId> {
  // 基础CRUD
  findById(id: ProductId): Promise<Product | null>;
  save(product: Product): Promise<void>;
  delete(id: ProductId): Promise<void>;
  
  // 业务查询
  findBySKU(sku: SKU): Promise<Product | null>;
  findByCategory(categoryId: CategoryId, options?: QueryOptions): Promise<QueryResult<Product>>;
  findByStatus(status: ProductStatus, options?: QueryOptions): Promise<QueryResult<Product>>;
  search(criteria: ProductSearchCriteria): Promise<QueryResult<Product>>;
  findLowStockProducts(threshold: number): Promise<Product[]>;
  findAll(options?: QueryOptions): Promise<QueryResult<Product>>;
  
  // 验证方法
  existsBySKU(sku: SKU): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  existsByNameInCategory(name: string, categoryId: CategoryId): Promise<boolean>;
} 