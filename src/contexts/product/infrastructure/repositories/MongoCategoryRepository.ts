import { injectable } from 'inversify';
import { Model, model } from 'mongoose';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { Category } from '../../domain/aggregates/Category';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { CategoryLevel } from '../../domain/enums';
import { CategorySchema, CategoryDocument } from '../persistence/CategorySchema';

@injectable()
export class MongoCategoryRepository implements CategoryRepository {
  private categoryModel: Model<CategoryDocument>;

  constructor() {
    this.categoryModel = model<CategoryDocument>('Category', CategorySchema);
  }

  public async save(category: Category): Promise<void> {
    const categoryData = this.toDocument(category);
    
    await this.categoryModel.findByIdAndUpdate(
      categoryData._id,
      categoryData,
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
  }

  public async findById(id: CategoryId): Promise<Category | null> {
    const categoryDoc = await this.categoryModel.findById(id.toString());
    return categoryDoc ? this.toDomain(categoryDoc) : null;
  }

  public async findByName(name: string): Promise<Category | null> {
    const categoryDoc = await this.categoryModel.findOne({ name });
    return categoryDoc ? this.toDomain(categoryDoc) : null;
  }

  public async findAll(): Promise<Category[]> {
    const categoryDocs = await this.categoryModel.find().sort({ level: 1, displayOrder: 1 });
    return categoryDocs.map(doc => this.toDomain(doc));
  }

  public async findByLevel(level: CategoryLevel): Promise<Category[]> {
    const categoryDocs = await this.categoryModel.find({ level }).sort({ displayOrder: 1 });
    return categoryDocs.map(doc => this.toDomain(doc));
  }

  public async findChildren(parentId: CategoryId): Promise<Category[]> {
    const categoryDocs = await this.categoryModel.find({ 
      parentId: parentId.toString() 
    }).sort({ displayOrder: 1 });
    return categoryDocs.map(doc => this.toDomain(doc));
  }

  public async findTopLevelCategories(): Promise<Category[]> {
    const categoryDocs = await this.categoryModel.find({ 
      level: CategoryLevel.PRIMARY 
    }).sort({ displayOrder: 1 });
    return categoryDocs.map(doc => this.toDomain(doc));
  }

  public async findCategoryPath(categoryId: CategoryId): Promise<Category[]> {
    const category = await this.findById(categoryId);
    if (!category) {
      return [];
    }

    const path: Category[] = [category];
    let currentCategory = category;

    // 向上遍历父分类
    while (currentCategory.getParentId()) {
      const parent = await this.findById(currentCategory.getParentId()!);
      if (!parent) break;
      
      path.unshift(parent);
      currentCategory = parent;
    }

    return path;
  }

  public async hasChildren(categoryId: CategoryId): Promise<boolean> {
    const count = await this.categoryModel.countDocuments({ 
      parentId: categoryId.toString() 
    });
    return count > 0;
  }

  public async existsByName(name: string): Promise<boolean> {
    const count = await this.categoryModel.countDocuments({ name });
    return count > 0;
  }

  public async delete(id: CategoryId): Promise<void> {
    // 检查是否有子分类
    const hasChildren = await this.hasChildren(id);
    if (hasChildren) {
      throw new Error('不能删除包含子分类的分类');
    }

    await this.categoryModel.findByIdAndDelete(id.toString());
  }

  public async exists(id: CategoryId): Promise<boolean> {
    const count = await this.categoryModel.countDocuments({ _id: id.toString() });
    return count > 0;
  }

  public async countByLevel(level: CategoryLevel): Promise<number> {
    return await this.categoryModel.countDocuments({ level });
  }

  public async updateDisplayOrder(categoryId: CategoryId, newOrder: number): Promise<void> {
    await this.categoryModel.findByIdAndUpdate(
      categoryId.toString(),
      { displayOrder: newOrder },
      { runValidators: true }
    );
  }

  public async findWithPagination(
    page: number, 
    limit: number, 
    filters?: {
      level?: CategoryLevel;
      parentId?: CategoryId;
      isActive?: boolean;
    }
  ): Promise<{ categories: Category[]; total: number; totalPages: number }> {
    const query: any = {};

    if (filters?.level) {
      query.level = filters.level;
    }
    
    if (filters?.parentId) {
      query.parentId = filters.parentId.toString();
    }
    
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const skip = (page - 1) * limit;
    
    const [categoryDocs, total] = await Promise.all([
      this.categoryModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ level: 1, displayOrder: 1 }),
      this.categoryModel.countDocuments(query)
    ]);

    return {
      categories: categoryDocs.map(doc => this.toDomain(doc)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  private toDocument(category: Category): any {
    return {
      _id: category.getId().toString(),
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

  private toDomain(categoryDoc: CategoryDocument): Category {
    return Category.fromPersistence(
      CategoryId.fromString(categoryDoc._id),
      categoryDoc.name,
      categoryDoc.description,
      categoryDoc.level as CategoryLevel,
      categoryDoc.parentId ? CategoryId.fromString(categoryDoc.parentId) : null,
      categoryDoc.displayOrder,
      categoryDoc.isActive,
      categoryDoc.createdAt,
      categoryDoc.updatedAt
    );
  }
} 