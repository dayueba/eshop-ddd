import { Repository } from '../../../../shared/domain/Repository';
import { Cart } from '../aggregates/Cart';
import { CartId } from '../value-objects/CartId';
import { UserId } from '../../../user/domain/value-objects/UserId';

export interface CartRepository extends Repository<Cart, CartId> {
  /**
   * 通过用户ID查找购物车
   */
  findByUserId(userId: UserId): Promise<Cart | null>;

  /**
   * 检查用户是否已有购物车
   */
  existsByUserId(userId: UserId): Promise<boolean>;

  /**
   * 为用户创建新的购物车
   */
  createForUser(userId: UserId): Promise<Cart>;

  /**
   * 获取或创建用户购物车
   */
  findOrCreateByUserId(userId: UserId): Promise<Cart>;

  /**
   * 删除用户的购物车
   */
  deleteByUserId(userId: UserId): Promise<void>;

  /**
   * 查找所有非空购物车的数量
   */
  countNonEmptyCarts(): Promise<number>;

  /**
   * 查找指定时间前创建的空购物车
   */
  findEmptyCartsOlderThan(date: Date): Promise<Cart[]>;

  /**
   * 批量删除购物车
   */
  deleteMany(cartIds: CartId[]): Promise<void>;
} 