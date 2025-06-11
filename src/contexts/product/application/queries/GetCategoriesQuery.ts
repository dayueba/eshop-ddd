import { injectable, inject } from 'inversify';
import { Query } from '../../../../shared/application/UseCase';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { CategoryLevel } from '../../domain/enums';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { TYPES } from '../../../../config/container';

export interface GetCategoriesRequest {
  level?: CategoryLevel;
  parentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description: string;
  level: CategoryLevel;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCategoriesResponse {
  categories: CategoryDTO[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@injectable()
export class GetCategoriesQuery implements Query<GetCategoriesRequest, GetCategoriesResponse> {
  constructor(
    @inject(TYPES.CategoryRepository) private categoryRepository: CategoryRepository
  ) {}

  public async execute(request: GetCategoriesRequest): Promise<GetCategoriesResponse> {
    // 如果有分页参数，使用分页查询
    if (request.page && request.limit) {
      const filters: any = {};
      
      if (request.level) {
        filters.level = request.level;
      }
      
      if (request.parentId) {
        filters.parentId = CategoryId.fromString(request.parentId);
      }
      
      if (request.isActive !== undefined) {
        filters.isActive = request.isActive;
      }

      const result = await this.categoryRepository.findWithPagination(
        request.page,
        request.limit,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      return {
        categories: result.categories.map(category => this.toDTO(category)),
        pagination: {
          page: request.page,
          limit: request.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      };
    }

    // 不分页查询
    let categories: any[];

    if (request.level) {
      categories = await this.categoryRepository.findByLevel(request.level);
    } else if (request.parentId) {
      const parentId = CategoryId.fromString(request.parentId);
      categories = await this.categoryRepository.findChildren(parentId);
    } else {
      categories = await this.categoryRepository.findAll();
    }

    // 如果指定了激活状态过滤
    if (request.isActive !== undefined) {
      categories = categories.filter(cat => cat.isActive() === request.isActive);
    }

    return {
      categories: categories.map(category => this.toDTO(category))
    };
  }

  private toDTO(category: any): CategoryDTO {
    return {
      id: category.getId().toString(),
      name: category.getName(),
      description: category.getDescription(),
      level: category.getLevel(),
      parentId: category.getParentId()?.toString() || null,
      displayOrder: category.getDisplayOrder(),
      isActive: category.isActive(),
      createdAt: category.getCreatedAt(),
      updatedAt: category.getUpdatedAt()
    };
  }
} 