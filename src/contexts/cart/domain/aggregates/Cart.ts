import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { CartId } from '../value-objects/CartId';
import { UserId } from '../../../user/domain/value-objects/UserId';
import { CartItem } from '../entities/CartItem';
import { ProductId } from '../../../product/domain/value-objects/ProductId';
import { Price } from '../../../product/domain/value-objects/Price';
import { Quantity } from '../value-objects/Quantity';
import { ItemAddedToCartEvent } from '../events/ItemAddedToCartEvent';
import { ItemRemovedFromCartEvent } from '../events/ItemRemovedFromCartEvent';
import { CartClearedEvent } from '../events/CartClearedEvent';

interface CartProps {
  id: CartId;
  userId: UserId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class Cart extends AggregateRoot<CartProps> {
  private constructor(props: CartProps) {
    super(props.id, props);
  }

  public static create(userId: UserId): Cart {
    const cartId = CartId.create();
    const now = new Date();
    
    return new Cart({
      id: cartId,
      userId,
      items: [],
      createdAt: now,
      updatedAt: now
    });
  }

  public static fromPersistence(
    id: CartId,
    userId: UserId,
    items: CartItem[],
    createdAt: Date,
    updatedAt: Date
  ): Cart {
    return new Cart({
      id,
      userId,
      items,
      createdAt,
      updatedAt
    });
  }

  public getUserId(): UserId {
    return this.props.userId;
  }

  public getItems(): CartItem[] {
    return [...this.props.items];
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public addItem(
    productId: ProductId,
    productName: string,
    price: Price,
    quantity: Quantity
  ): void {
    // 检查商品是否已存在
    const existingItem = this.findItemByProductId(productId);
    
    if (existingItem) {
      // 如果商品已存在，增加数量
      existingItem.increaseQuantity(quantity);
    } else {
      // 如果商品不存在，添加新项
      const cartItem = CartItem.create(productId, productName, price, quantity);
      this.props.items.push(cartItem);
    }

    this.props.updatedAt = new Date();

    // 发布领域事件
    this.addDomainEvent(
      ItemAddedToCartEvent.create(
        this.props.id,
        this.props.userId,
        productId,
        productName,
        quantity
      )
    );
  }

  public updateItemQuantity(productId: ProductId, quantity: Quantity): void {
    const item = this.findItemByProductId(productId);
    if (!item) {
      throw new Error('购物车中未找到该商品');
    }

    item.updateQuantity(quantity);
    this.props.updatedAt = new Date();
  }

  public removeItem(productId: ProductId): void {
    const itemIndex = this.props.items.findIndex(
      item => item.getProductId().equals(productId)
    );

    if (itemIndex === -1) {
      throw new Error('购物车中未找到该商品');
    }

    const item = this.props.items[itemIndex];
    this.props.items.splice(itemIndex, 1);
    this.props.updatedAt = new Date();

    // 发布领域事件
    this.addDomainEvent(
      ItemRemovedFromCartEvent.create(
        this.props.id,
        this.props.userId,
        productId,
        item.getProductName()
      )
    );
  }

  public clear(): void {
    const itemCount = this.props.items.length;
    this.props.items = [];
    this.props.updatedAt = new Date();

    // 发布领域事件
    this.addDomainEvent(
      CartClearedEvent.create(
        this.props.id,
        this.props.userId,
        itemCount
      )
    );
  }

  public getTotalPrice(): Price {
    return this.props.items.reduce(
      (total, item) => total.add(item.getTotalPrice()),
      Price.create(0, 'CNY')
    );
  }

  public getTotalItemCount(): number {
    return this.props.items.reduce(
      (total, item) => total + item.getQuantity().getValue(),
      0
    );
  }

  public isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  public hasItem(productId: ProductId): boolean {
    return this.findItemByProductId(productId) !== undefined;
  }

  public getItemQuantity(productId: ProductId): Quantity | null {
    const item = this.findItemByProductId(productId);
    return item ? item.getQuantity() : null;
  }

  private findItemByProductId(productId: ProductId): CartItem | undefined {
    return this.props.items.find(item => 
      item.getProductId().equals(productId)
    );
  }

  protected validate(): void {
    if (!this.props.id) {
      throw new Error('购物车ID不能为空');
    }
    if (!this.props.userId) {
      throw new Error('用户ID不能为空');
    }
    if (!this.props.items) {
      throw new Error('购物车项目列表不能为空');
    }
    if (!this.props.createdAt) {
      throw new Error('创建时间不能为空');
    }
    if (!this.props.updatedAt) {
      throw new Error('更新时间不能为空');
    }
  }
} 