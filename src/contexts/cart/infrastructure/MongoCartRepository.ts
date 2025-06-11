import { injectable } from 'inversify';
import { Model, model } from 'mongoose';
import { CartRepository } from '../domain/repositories/CartRepository';
import { Cart } from '../domain/aggregates/Cart';
import { CartId } from '../domain/value-objects/CartId';
import { UserId } from '../../user/domain/value-objects/UserId';
import { CartSchema, CartDocument } from './CartSchema';
import { CartItem } from '../domain/entities/CartItem';
import { ProductId } from '../../product/domain/value-objects/ProductId';
import { Price } from '../../product/domain/value-objects/Price';
import { Quantity } from '../domain/value-objects/Quantity';

@injectable()
export class MongoCartRepository implements CartRepository {
  private cartModel: Model<CartDocument>;

  constructor() {
    this.cartModel = model<CartDocument>('Cart', CartSchema);
  }

  public async save(cart: Cart): Promise<void> {
    const cartData = this.toDocument(cart);
    
    await this.cartModel.findByIdAndUpdate(
      cartData._id,
      cartData,
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
  }

  public async findById(id: CartId): Promise<Cart | null> {
    const cartDoc = await this.cartModel.findById(id.toString());
    return cartDoc ? this.toDomain(cartDoc) : null;
  }

  public async findByUserId(userId: UserId): Promise<Cart | null> {
    const cartDoc = await this.cartModel.findOne({ userId: userId.toString() });
    return cartDoc ? this.toDomain(cartDoc) : null;
  }

  public async existsByUserId(userId: UserId): Promise<boolean> {
    const count = await this.cartModel.countDocuments({ userId: userId.toString() });
    return count > 0;
  }

  public async createForUser(userId: UserId): Promise<Cart> {
    const cart = Cart.create(userId);
    await this.save(cart);
    return cart;
  }

  public async findOrCreateByUserId(userId: UserId): Promise<Cart> {
    const existingCart = await this.findByUserId(userId);
    if (existingCart) {
      return existingCart;
    }
    return await this.createForUser(userId);
  }

  public async delete(id: CartId): Promise<void> {
    await this.cartModel.findByIdAndDelete(id.toString());
  }

  public async deleteByUserId(userId: UserId): Promise<void> {
    await this.cartModel.deleteOne({ userId: userId.toString() });
  }

  public async exists(id: CartId): Promise<boolean> {
    const count = await this.cartModel.countDocuments({ _id: id.toString() });
    return count > 0;
  }

  public async countNonEmptyCarts(): Promise<number> {
    return await this.cartModel.countDocuments({
      items: { $not: { $size: 0 } }
    });
  }

  public async findEmptyCartsOlderThan(date: Date): Promise<Cart[]> {
    const cartDocs = await this.cartModel.find({
      items: { $size: 0 },
      updatedAt: { $lt: date }
    });
    
    return cartDocs.map(doc => this.toDomain(doc));
  }

  public async deleteMany(cartIds: CartId[]): Promise<void> {
    const ids = cartIds.map(id => id.toString());
    await this.cartModel.deleteMany({ _id: { $in: ids } });
  }

  private toDocument(cart: Cart): any {
    const items = cart.getItems().map(item => ({
      productId: item.getProductId().toString(),
      productName: item.getProductName(),
      price: {
        amount: item.getPrice().getAmount(),
        currency: item.getPrice().getCurrency()
      },
      quantity: item.getQuantity().getValue(),
      addedAt: item.getAddedAt()
    }));

    return {
      _id: cart.getId().toString(),
      userId: cart.getUserId().toString(),
      items,
      createdAt: cart.getCreatedAt(),
      updatedAt: cart.getUpdatedAt()
    };
  }

  private toDomain(cartDoc: CartDocument): Cart {
    const cartItems = cartDoc.items.map(item => {
      return CartItem.create(
        ProductId.fromString(item.productId),
        item.productName,
        Price.create(item.price.amount, item.price.currency),
        Quantity.create(item.quantity)
      );
    });

    return Cart.fromPersistence(
      CartId.fromString(cartDoc._id),
      UserId.fromString(cartDoc.userId),
      cartItems,
      cartDoc.createdAt,
      cartDoc.updatedAt
    );
  }
} 