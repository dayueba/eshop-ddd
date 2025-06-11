import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { CategoryId } from '../CategoryId';
import { CategoryLevel } from '../enums';
import { CategoryCreatedEvent } from '../events/CategoryCreatedEvent';
import { CategoryDeletedEvent } from '../events/CategoryDeletedEvent';

interface CategoryProps {
  name: string;
  description: string;
  parentId?: CategoryId;
  level: CategoryLevel;
  path: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Category extends AggregateRoot<CategoryId> {
  private constructor(private props: CategoryProps, id?: CategoryId) {
    super(id || CategoryId.create());
    this.validate();
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('分类名称不能为空');
    }

    if (this.props.name.length > 50) {
      throw new Error('分类名称不能超过50个字符');
    }

    if (this.props.level < CategoryLevel.ROOT || this.props.level > CategoryLevel.LEVEL_3) {
      throw new Error('分类层级无效');
    }

    if (this.props.level === CategoryLevel.ROOT && this.props.parentId) {
      throw new Error('根分类不能有父分类');
    }

    if (this.props.level > CategoryLevel.ROOT && !this.props.parentId) {
      throw new Error('非根分类必须有父分类');
    }
  }

  // 静态工厂方法
  public static createRoot(name: string, description: string): Category {
    const id = CategoryId.create();
    const now = new Date();
    const path = `/${name.toLowerCase().replace(/\s+/g, '-')}`;

    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      level: CategoryLevel.ROOT,
      path,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }, id);

    // 发布领域事件
    category.addDomainEvent(new CategoryCreatedEvent(
      id.getValue(),
      name
    ));

    return category;
  }

  public static createSubCategory(
    name: string,
    description: string,
    parentCategory: Category
  ): Category {
    const parentLevel = parentCategory.getLevel();
    
    if (parentLevel >= CategoryLevel.LEVEL_3) {
      throw new Error('已达到最大分类层级');
    }

    const id = CategoryId.create();
    const now = new Date();
    const level = (parentLevel + 1) as CategoryLevel;
    const path = `${parentCategory.getPath()}/${name.toLowerCase().replace(/\s+/g, '-')}`;

    const category = new Category({
      name: name.trim(),
      description: description.trim(),
      parentId: parentCategory.id,
      level,
      path,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }, id);

    // 发布领域事件
    category.addDomainEvent(new CategoryCreatedEvent(
      id.getValue(),
      name,
      parentCategory.id.getValue()
    ));

    return category;
  }

  public static reconstitute(props: CategoryProps, id: CategoryId): Category {
    return new Category(props, id);
  }

  // Getters
  public getName(): string {
    return this.props.name;
  }

  public getDescription(): string {
    return this.props.description;
  }

  public getParentId(): CategoryId | undefined {
    return this.props.parentId;
  }

  public getLevel(): CategoryLevel {
    return this.props.level;
  }

  public getPath(): string {
    return this.props.path;
  }

  public isActiveCategory(): boolean {
    return this.props.isActive;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // 业务方法
  public updateBasicInfo(name: string, description: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('分类名称不能为空');
    }

    if (name.length > 50) {
      throw new Error('分类名称不能超过50个字符');
    }

    this.props.name = name.trim();
    this.props.description = description.trim();
    this.props.updatedAt = new Date();
    
    // 更新路径
    this.updatePath();
  }

  private updatePath(): void {
    const slug = this.props.name.toLowerCase().replace(/\s+/g, '-');
    
    if (this.props.level === CategoryLevel.ROOT) {
      this.props.path = `/${slug}`;
    } else {
      // 对于子分类，需要父分类的路径，这里简化处理
      const parentPath = this.props.path.split('/').slice(0, -1).join('/');
      this.props.path = `${parentPath}/${slug}`;
    }
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public delete(): void {
    // 发布删除事件
    this.addDomainEvent(new CategoryDeletedEvent(
      this.id.getValue(),
      this.props.name
    ));
  }

  // 业务查询方法
  public isRoot(): boolean {
    return this.props.level === CategoryLevel.ROOT;
  }

  public isLeaf(): boolean {
    return this.props.level === CategoryLevel.LEVEL_3;
  }

  public canHaveSubCategory(): boolean {
    return this.props.level < CategoryLevel.LEVEL_3;
  }

  // 生成URL友好的slug
  public getSlug(): string {
    return this.props.name.toLowerCase().replace(/\s+/g, '-');
  }

  // 序列化
  public toJSON() {
    return {
      id: this.id.getValue(),
      name: this.props.name,
      description: this.props.description,
      parentId: this.props.parentId?.getValue(),
      level: this.props.level,
      path: this.props.path,
      slug: this.getSlug(),
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
} 