import { Repository } from '../../../../shared/domain/Repository';
import { Category } from '../aggregates/Category';
import { CategoryId } from '../CategoryId';
import { CategoryLevel } from '../enums';

export interface CategoryRepository extends Repository<Category, CategoryId> {
  // 基础CRUD
  findById(id: CategoryId): Promise<Category | null>;
  save(category: Category): Promise<void>;
  delete(id: CategoryId): Promise<void>;
  
  // 业务查询
  findByParentId(parentId: CategoryId): Promise<Category[]>;
  findByLevel(level: CategoryLevel): Promise<Category[]>;
  findRootCategories(): Promise<Category[]>;
  findCategoryPath(categoryId: CategoryId): Promise<Category[]>;
  findActiveCategories(): Promise<Category[]>;
  findAll(): Promise<Category[]>;
  
  // 验证方法
  existsByNameAndParent(name: string, parentId?: CategoryId): Promise<boolean>;
  hasSubCategories(categoryId: CategoryId): Promise<boolean>;
  hasProducts(categoryId: CategoryId): Promise<boolean>;
} 