import { injectable, inject } from 'inversify';
import { Command } from '../../../../shared/application/UseCase';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { Category } from '../../domain/aggregates/Category';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { CategoryLevel } from '../../domain/enums';
import { EventBus } from '../../../../shared/domain/EventBus';
import { TYPES } from '../../../../config/container';

export interface CreateCategoryRequest {
  name: string;
  description: string;
  level: CategoryLevel;
  parentId?: string;
  displayOrder?: number;
}

@injectable()
export class CreateCategoryCommand implements Command<CreateCategoryRequest> {
  constructor(
    @inject(TYPES.CategoryRepository) private categoryRepository: CategoryRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(request: CreateCategoryRequest): Promise<void> {
    // 验证分类名称唯一性
    const existingCategory = await this.categoryRepository.findByName(request.name);
    if (existingCategory) {
      throw new Error('分类名称已存在');
    }

    // 验证父分类
    let parentId: CategoryId | null = null;
    if (request.parentId) {
      parentId = CategoryId.fromString(request.parentId);
      const parentCategory = await this.categoryRepository.findById(parentId);
      if (!parentCategory) {
        throw new Error('父分类不存在');
      }

      // 验证层级关系
      if (request.level !== CategoryLevel.SECONDARY && parentCategory.getLevel() !== CategoryLevel.PRIMARY) {
        throw new Error('分类层级关系不正确');
      }
    }

    // 创建分类
    const category = Category.create(
      request.name,
      request.description,
      request.level,
      parentId,
      request.displayOrder || 0
    );

    // 保存分类
    await this.categoryRepository.save(category);

    // 发布领域事件
    await this.eventBus.publishAll(category.getUncommittedEvents());
    category.markEventsAsCommitted();
  }
} 