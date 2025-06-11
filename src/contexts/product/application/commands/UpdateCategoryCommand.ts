import { injectable, inject } from 'inversify';
import { Command } from '../../../../shared/application/UseCase';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { EventBus } from '../../../../shared/domain/EventBus';
import { TYPES } from '../../../../config/container';

export interface UpdateCategoryRequest {
  categoryId: string;
  name?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryResponse {
  categoryId: string;
  updatedAt: Date;
}

@injectable()
export class UpdateCategoryCommand implements Command<UpdateCategoryRequest, UpdateCategoryResponse> {
  constructor(
    @inject(TYPES.CategoryRepository) private categoryRepository: CategoryRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(request: UpdateCategoryRequest): Promise<UpdateCategoryResponse> {
    const categoryId = CategoryId.fromString(request.categoryId);
    
    // 1. 获取分类
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new Error('分类不存在');
    }

    // 2. 更新分类信息
    if (request.name !== undefined) {
      category.updateName(request.name);
    }

    if (request.description !== undefined) {
      category.updateDescription(request.description);
    }

    if (request.displayOrder !== undefined) {
      category.updateDisplayOrder(request.displayOrder);
    }

    if (request.isActive !== undefined) {
      if (request.isActive) {
        category.activate();
      } else {
        category.deactivate();
      }
    }

    // 3. 保存分类
    await this.categoryRepository.save(category);

    // 4. 发布领域事件
    await this.eventBus.publishAll(category.getUncommittedEvents());
    category.markEventsAsCommitted();

    return {
      categoryId: category.getId().toString(),
      updatedAt: category.getUpdatedAt()
    };
  }
} 