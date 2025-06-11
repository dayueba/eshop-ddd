import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { ProductId } from '../ProductId';
import { CategoryId } from '../CategoryId';
import { Price } from '../value-objects/Price';
import { SKU } from '../value-objects/SKU';
import { Inventory } from '../value-objects/Inventory';
import { ProductImage } from '../value-objects/ProductImage';
import { ProductStatus } from '../enums';
import { ProductCreatedEvent } from '../events/ProductCreatedEvent';
import { ProductStatusChangedEvent } from '../events/ProductStatusChangedEvent';
import { InventoryUpdatedEvent } from '../events/InventoryUpdatedEvent';
import { ProductPriceChangedEvent } from '../events/ProductPriceChangedEvent';

interface ProductProps {
  name: string;
  description: string;
  price: Price;
  sku: SKU;
  categoryId: CategoryId;
  inventory: Inventory;
  images: ProductImage[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends AggregateRoot<ProductId> {
  private constructor(private props: ProductProps, id?: ProductId) {
    super(id || ProductId.create());
    this.validate();
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('商品名称不能为空');
    }

    if (this.props.name.length > 100) {
      throw new Error('商品名称不能超过100个字符');
    }

    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new Error('商品描述不能为空');
    }

    if (this.props.images.length > 10) {
      throw new Error('商品图片最多10张');
    }

    // 验证是否有且仅有一张主图
    const primaryImages = this.props.images.filter(img => img.isPrimaryImage());
    if (this.props.images.length > 0 && primaryImages.length !== 1) {
      throw new Error('必须有且仅有一张主图');
    }
  }

  // 静态工厂方法
  public static create(
    name: string,
    description: string,
    price: Price,
    sku: SKU,
    categoryId: CategoryId,
    initialStock: number,
    images: ProductImage[] = []
  ): Product {
    const id = ProductId.create();
    const inventory = new Inventory(initialStock);
    const now = new Date();

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price,
      sku,
      categoryId,
      inventory,
      images,
      status: ProductStatus.DRAFT,
      createdAt: now,
      updatedAt: now
    }, id);

    // 发布领域事件
    product.addDomainEvent(new ProductCreatedEvent(
      id.getValue(),
      name,
      categoryId.getValue(),
      { amount: price.getAmount(), currency: price.getCurrency() }
    ));

    return product;
  }

  public static reconstitute(props: ProductProps, id: ProductId): Product {
    return new Product(props, id);
  }

  // Getters
  public getName(): string {
    return this.props.name;
  }

  public getDescription(): string {
    return this.props.description;
  }

  public getPrice(): Price {
    return this.props.price;
  }

  public getSKU(): SKU {
    return this.props.sku;
  }

  public getCategoryId(): CategoryId {
    return this.props.categoryId;
  }

  public getInventory(): Inventory {
    return this.props.inventory;
  }

  public getImages(): ProductImage[] {
    return [...this.props.images];
  }

  public getPrimaryImage(): ProductImage | null {
    return this.props.images.find(img => img.isPrimaryImage()) || null;
  }

  public getStatus(): ProductStatus {
    return this.props.status;
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
      throw new Error('商品名称不能为空');
    }

    if (name.length > 100) {
      throw new Error('商品名称不能超过100个字符');
    }

    if (!description || description.trim().length === 0) {
      throw new Error('商品描述不能为空');
    }

    this.props.name = name.trim();
    this.props.description = description.trim();
    this.props.updatedAt = new Date();
  }

  public updatePrice(price: Price): void {
    const oldPrice = this.props.price;
    this.props.price = price;
    this.props.updatedAt = new Date();

    // 发布价格变更事件
    this.addDomainEvent(new ProductPriceChangedEvent(
      this.id.getValue(),
      oldPrice,
      price
    ));
  }

  public updateCategory(categoryId: CategoryId): void {
    this.props.categoryId = categoryId;
    this.props.updatedAt = new Date();
  }

  public updateStatus(status: ProductStatus): void {
    if (this.props.status === status) {
      return;
    }

    const oldStatus = this.props.status;

    // 状态变更业务规则
    if (status === ProductStatus.ACTIVE && !this.props.inventory.isInStock()) {
      throw new Error('没有库存的商品不能激活');
    }

    this.props.status = status;
    this.props.updatedAt = new Date();

    // 发布状态变更事件
    this.addDomainEvent(new ProductStatusChangedEvent(
      this.id.getValue(),
      oldStatus,
      status
    ));
  }

  public activate(): void {
    this.updateStatus(ProductStatus.ACTIVE);
  }

  public deactivate(): void {
    this.updateStatus(ProductStatus.INACTIVE);
  }

  public markAsOutOfStock(): void {
    this.updateStatus(ProductStatus.OUT_OF_STOCK);
  }

  public discontinue(): void {
    this.updateStatus(ProductStatus.DISCONTINUED);
  }

  // 库存管理
  public reserveInventory(quantity: number): void {
    if (this.props.status !== ProductStatus.ACTIVE) {
      throw new Error('只有激活状态的商品才能预留库存');
    }

    const oldQuantity = this.props.inventory.getQuantity();
    this.props.inventory = this.props.inventory.reserve(quantity);
    this.props.updatedAt = new Date();

    // 如果库存变为0，自动标记为缺货
    if (!this.props.inventory.isInStock()) {
      this.markAsOutOfStock();
    }

    // 发布库存更新事件
    this.addDomainEvent(new InventoryUpdatedEvent(
      this.id.getValue(),
      oldQuantity,
      this.props.inventory.getQuantity(),
      `预留库存 ${quantity} 件`
    ));
  }

  public releaseInventory(quantity: number): void {
    const oldQuantity = this.props.inventory.getQuantity();
    this.props.inventory = this.props.inventory.releaseReservation(quantity);
    this.props.updatedAt = new Date();

    // 如果恢复库存，可能需要更新状态
    if (this.props.status === ProductStatus.OUT_OF_STOCK && this.props.inventory.isInStock()) {
      this.activate();
    }

    // 发布库存更新事件
    this.addDomainEvent(new InventoryUpdatedEvent(
      this.id.getValue(),
      oldQuantity,
      this.props.inventory.getQuantity(),
      `释放预留库存 ${quantity} 件`
    ));
  }

  public deductInventory(quantity: number): void {
    const oldQuantity = this.props.inventory.getQuantity();
    this.props.inventory = this.props.inventory.deduct(quantity);
    this.props.updatedAt = new Date();

    // 如果库存变为0，自动标记为缺货
    if (!this.props.inventory.isInStock()) {
      this.markAsOutOfStock();
    }

    // 发布库存更新事件
    this.addDomainEvent(new InventoryUpdatedEvent(
      this.id.getValue(),
      oldQuantity,
      this.props.inventory.getQuantity(),
      `扣减库存 ${quantity} 件`
    ));
  }

  public addStock(quantity: number): void {
    const oldQuantity = this.props.inventory.getQuantity();
    this.props.inventory = this.props.inventory.addStock(quantity);
    this.props.updatedAt = new Date();

    // 如果恢复库存，可能需要更新状态
    if (this.props.status === ProductStatus.OUT_OF_STOCK && this.props.inventory.isInStock()) {
      this.activate();
    }

    // 发布库存更新事件
    this.addDomainEvent(new InventoryUpdatedEvent(
      this.id.getValue(),
      oldQuantity,
      this.props.inventory.getQuantity(),
      `增加库存 ${quantity} 件`
    ));
  }

  // 图片管理
  public addImage(image: ProductImage): void {
    if (this.props.images.length >= 10) {
      throw new Error('商品图片最多10张');
    }

    // 如果是主图，需要取消其他主图
    if (image.isPrimaryImage()) {
      this.props.images = this.props.images.map(img => img.setPrimary(false));
    }

    this.props.images.push(image);
    this.props.updatedAt = new Date();
  }

  public removeImage(imageUrl: string): void {
    const imageIndex = this.props.images.findIndex(img => img.getUrl() === imageUrl);
    if (imageIndex === -1) {
      throw new Error('图片不存在');
    }

    const removedImage = this.props.images[imageIndex];
    this.props.images.splice(imageIndex, 1);

    // 如果删除的是主图，设置第一张图为主图
    if (removedImage.isPrimaryImage() && this.props.images.length > 0) {
      this.props.images[0] = this.props.images[0].setPrimary(true);
    }

    this.props.updatedAt = new Date();
  }

  public setPrimaryImage(imageUrl: string): void {
    const imageIndex = this.props.images.findIndex(img => img.getUrl() === imageUrl);
    if (imageIndex === -1) {
      throw new Error('图片不存在');
    }

    // 取消所有主图
    this.props.images = this.props.images.map(img => img.setPrimary(false));
    // 设置新主图
    this.props.images[imageIndex] = this.props.images[imageIndex].setPrimary(true);
    this.props.updatedAt = new Date();
  }

  // 业务查询方法
  public isAvailableForPurchase(): boolean {
    return this.props.status === ProductStatus.ACTIVE && this.props.inventory.isInStock();
  }

  public canReserve(quantity: number): boolean {
    return this.isAvailableForPurchase() && this.props.inventory.canReserve(quantity);
  }

  public isLowStock(): boolean {
    return this.props.inventory.isLowStock();
  }

  // 序列化
  public toJSON() {
    return {
      id: this.id.getValue(),
      name: this.props.name,
      description: this.props.description,
      price: this.props.price.toJSON(),
      sku: this.props.sku.toString(),
      categoryId: this.props.categoryId.getValue(),
      inventory: this.props.inventory.toJSON(),
      images: this.props.images.map(img => img.toJSON()),
      status: this.props.status,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }
} 