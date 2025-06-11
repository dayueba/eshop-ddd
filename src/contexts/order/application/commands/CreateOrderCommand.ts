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
import { Currency, PaymentMethod } from '../../domain/enums';
import { EventBus } from '../../../../shared/domain/EventBus';
import { InventoryService } from '../../../product/domain/services/InventoryService';
import { OrderPricingService } from '../../domain/services/OrderPricingService';
import { ProductId } from '../../../product/domain/ProductId';
import { TYPES } from '../../../../config/container';

export interface CreateOrderRequest {
  userId: string;
  cartId?: string; // 可选，如果不提供则使用用户的默认购物车
  shippingAddress: {
    country: string;
    province: string;
    city: string;
    district: string;
    street: string;
    zipCode?: string;
    contactName: string;
    contactPhone: string;
  };
  billingAddress?: {
    country: string;
    province: string;
    city: string;
    district: string;
    street: string;
    zipCode?: string;
    contactName: string;
    contactPhone: string;
  };
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  currency?: Currency;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: {
    amount: number;
    currency: string;
  };
  subtotal: {
    amount: number;
    currency: string;
  };
  discountAmount: {
    amount: number;
    currency: string;
  };
  shippingFee: {
    amount: number;
    currency: string;
  };
  taxAmount: {
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
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.InventoryService) private inventoryService: InventoryService,
    @inject(TYPES.OrderPricingService) private orderPricingService: OrderPricingService
  ) {}

  public async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    const userId = UserId.fromString(request.userId);
    const currency = request.currency || Currency.CNY;

    // 1. 获取购物车
    const cart = await this.getCart(request.cartId, userId);
    if (cart.isEmpty()) {
      throw new Error('购物车为空，无法创建订单');
    }

    // 2. 准备库存验证数据
    const cartItems = cart.getItems();
    const inventoryItems = cartItems.map(cartItem => ({
      productId: ProductId.fromString(cartItem.getProductId()),
      productName: cartItem.getProductName(),
      requestedQuantity: cartItem.getQuantity().getValue()
    }));

    // 3. 使用库存服务验证和预留库存
    const reservedProducts = await this.inventoryService.reserveInventoryBatch(inventoryItems);

    try {
      // 4. 创建订单项
      const orderItems = await this.createOrderItems(cartItems, reservedProducts);

      // 5. 创建地址值对象
      const shippingAddress = this.createAddress(request.shippingAddress);
      const billingAddress = request.billingAddress 
        ? this.createAddress(request.billingAddress) 
        : shippingAddress;

      // 6. 使用定价服务计算订单价格
      const pricing = this.orderPricingService.calculateOrderPricing(
        orderItems,
        shippingAddress,
        request.couponCode,
        currency
      );

      // 7. 创建订单
      const order = Order.create(
        request.userId,
        orderItems,
        shippingAddress,
        billingAddress,
        request.paymentMethod,
        pricing.shippingFee,
        pricing.taxAmount,
        pricing.discountAmount,
        request.notes
      );

      // 8. 保存订单
      await this.orderRepository.save(order);

      // 9. 清空购物车
      cart.clear();
      await this.cartRepository.save(cart);

      // 10. 发布领域事件
      await this.publishEvents(order, cart);

      return {
        orderId: order.getId().toString(),
        orderNumber: order.getOrderNumber().getValue(),
        totalAmount: {
          amount: pricing.totalAmount.getAmount(),
          currency: pricing.totalAmount.getCurrency()
        },
        subtotal: {
          amount: pricing.subtotal.getAmount(),
          currency: pricing.subtotal.getCurrency()
        },
        discountAmount: {
          amount: pricing.discountAmount.getAmount(),
          currency: pricing.discountAmount.getCurrency()
        },
        shippingFee: {
          amount: pricing.shippingFee.getAmount(),
          currency: pricing.shippingFee.getCurrency()
        },
        taxAmount: {
          amount: pricing.taxAmount.getAmount(),
          currency: pricing.taxAmount.getCurrency()
        }
      };

    } catch (error) {
      // 如果订单创建失败，释放已预留的库存
      await this.releaseReservedInventory(inventoryItems);
      throw error;
    }
  }

  private async getCart(cartId: string | undefined, userId: UserId) {
    if (cartId) {
      const cartIdValue = CartId.fromString(cartId);
      const cart = await this.cartRepository.findById(cartIdValue);
      if (!cart) {
        throw new Error('购物车不存在');
      }
      return cart;
    } else {
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        throw new Error('购物车不存在');
      }
      return cart;
    }
  }

  private async createOrderItems(cartItems: any[], reservedProducts: any[]): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (let i = 0; i < cartItems.length; i++) {
      const cartItem = cartItems[i];
      const product = reservedProducts[i];

      // 创建订单项（使用当前商品价格）
      const orderItem = OrderItem.create(
        cartItem.getProductId(),
        cartItem.getProductName(),
        product.getSKU().getCode(),
        cartItem.getQuantity().getValue(),
        product.getPrice(),
        Money.zero(product.getPrice().getCurrency()),
        {
          name: product.getName(),
          description: product.getDescription(),
          imageUrl: product.getImages()[0]?.getUrl() || '',
          attributes: {}
        }
      );

      orderItems.push(orderItem);
    }

    return orderItems;
  }

  private createAddress(addressData: any): Address {
    return new Address({
      country: addressData.country,
      province: addressData.province,
      city: addressData.city,
      district: addressData.district,
      street: addressData.street,
      zipCode: addressData.zipCode,
      contactName: addressData.contactName,
      contactPhone: addressData.contactPhone
    });
  }

  private async releaseReservedInventory(inventoryItems: any[]): Promise<void> {
    try {
      const releaseItems = inventoryItems.map(item => ({
        productId: item.productId,
        quantity: item.requestedQuantity
      }));
      await this.inventoryService.releaseReservedInventoryBatch(releaseItems);
    } catch (error) {
      // 记录错误但不抛出，避免掩盖原始错误
      console.error('释放库存失败:', error);
    }
  }

  private async publishEvents(order: any, cart: any): Promise<void> {
    // 发布订单事件
    await this.eventBus.publishAll(order.getUncommittedEvents());
    order.markEventsAsCommitted();

    // 发布购物车事件
    await this.eventBus.publishAll(cart.getUncommittedEvents());
    cart.markEventsAsCommitted();
  }
}