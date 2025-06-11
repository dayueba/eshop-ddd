import { injectable, inject } from 'inversify';
import { Command } from '../../../../shared/application/UseCase';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { CartRepository } from '../../../cart/domain/repositories/CartRepository';
import { ProductRepository } from '../../../product/domain/repositories/ProductRepository';
import { Order } from '../../domain/aggregates/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { UserId } from '../../../user/domain/value-objects/UserId';
import { CartId } from '../../../cart/domain/value-objects/CartId';
import { Address } from '../../domain/value-objects/Address';
import { Money } from '../../domain/value-objects/Money';
import { Currency } from '../../domain/enums';
import { EventBus } from '../../../../shared/domain/EventBus';
import { TYPES } from '../../../../config/container';

export interface CreateOrderRequest {
  userId: string;
  cartId?: string; // 可选，如果不提供则使用用户的默认购物车
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };
  currency?: Currency;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: {
    amount: number;
    currency: string;
  };
}

@injectable()
export class CreateOrderCommand implements Command<CreateOrderRequest, CreateOrderResponse> {
  constructor(
    @inject(TYPES.OrderRepository) private orderRepository: OrderRepository,
    @inject(TYPES.CartRepository) private cartRepository: CartRepository,
    @inject(TYPES.ProductRepository) private productRepository: ProductRepository,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  public async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    const userId = UserId.fromString(request.userId);

    // 1. 获取购物车
    let cart;
    if (request.cartId) {
      const cartId = CartId.fromString(request.cartId);
      cart = await this.cartRepository.findById(cartId);
    } else {
      cart = await this.cartRepository.findByUserId(userId);
    }

    if (!cart) {
      throw new Error('购物车不存在');
    }

    if (cart.isEmpty()) {
      throw new Error('购物车为空，无法创建订单');
    }

    // 2. 验证购物车商品库存
    const cartItems = cart.getItems();
    const orderItems: OrderItem[] = [];
    let totalAmount = 0;
    const currency = request.currency || Currency.CNY;

    for (const cartItem of cartItems) {
      // 验证商品是否存在
      const product = await this.productRepository.findById(cartItem.getProductId());
      if (!product) {
        throw new Error(`商品 ${cartItem.getProductName()} 不存在`);
      }

      // 验证商品状态
      if (product.getStatus() !== 'ACTIVE') {
        throw new Error(`商品 ${cartItem.getProductName()} 已下架`);
      }

      // 验证库存
      const requestedQuantity = cartItem.getQuantity().getValue();
      const availableStock = product.getInventory().getAvailable();
      
      if (availableStock < requestedQuantity) {
        throw new Error(`商品 ${cartItem.getProductName()} 库存不足，可用库存：${availableStock}，需要：${requestedQuantity}`);
      }

      // 创建订单项（使用当前商品价格）
      const orderItem = OrderItem.create(
        cartItem.getProductId(),
        cartItem.getProductName(),
        product.getSKU().getValue(),
        product.getPrice(),
        cartItem.getQuantity()
      );

      orderItems.push(orderItem);
      totalAmount += orderItem.getSubtotal().getAmount();

      // 预留库存
      product.reserveInventory(requestedQuantity);
      await this.productRepository.save(product);
    }

    // 3. 创建收货地址
    const shippingAddress = Address.create(request.shippingAddress);

    // 4. 创建订单
    const order = Order.create(
      userId,
      orderItems,
      Money.create(totalAmount, currency),
      shippingAddress
    );

    // 5. 保存订单
    await this.orderRepository.save(order);

    // 6. 清空购物车
    cart.clear();
    await this.cartRepository.save(cart);

    // 7. 发布领域事件
    await this.eventBus.publishAll(order.getUncommittedEvents());
    order.markEventsAsCommitted();

    // 8. 发布购物车事件
    await this.eventBus.publishAll(cart.getUncommittedEvents());
    cart.markEventsAsCommitted();

    return {
      orderId: order.getId().toString(),
      orderNumber: order.getOrderNumber().getValue(),
      totalAmount: {
        amount: order.getTotalAmount().getAmount(),
        currency: order.getTotalAmount().getCurrency()
      }
    };
  }
}