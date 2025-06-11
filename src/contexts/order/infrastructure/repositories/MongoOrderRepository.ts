import { injectable } from 'inversify';
import { Model, model } from 'mongoose';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order } from '../../domain/aggregates/Order';
import { OrderId } from '../../domain/value-objects/OrderId';
import { UserId } from '../../../user/domain/value-objects/UserId';
import { OrderNumber } from '../../domain/value-objects/OrderNumber';
import { Money } from '../../domain/value-objects/Money';
import { Address } from '../../domain/value-objects/Address';
import { OrderItem } from '../../domain/entities/OrderItem';
import { ProductId } from '../../../product/domain/value-objects/ProductId';
import { Price } from '../../../product/domain/value-objects/Price';
import { Quantity } from '../../../cart/domain/value-objects/Quantity';
import { OrderStatus, PaymentStatus, ShippingStatus, Currency } from '../../domain/enums';
import { OrderSchema, OrderDocument } from '../persistence/OrderSchema';

@injectable()
export class MongoOrderRepository implements OrderRepository {
  private orderModel: Model<OrderDocument>;

  constructor() {
    this.orderModel = model<OrderDocument>('Order', OrderSchema);
  }

  public async save(order: Order): Promise<void> {
    const orderData = this.toDocument(order);
    
    await this.orderModel.findByIdAndUpdate(
      orderData._id,
      orderData,
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
  }

  public async findById(id: OrderId): Promise<Order | null> {
    const orderDoc = await this.orderModel.findById(id.toString());
    return orderDoc ? this.toDomain(orderDoc) : null;
  }

  public async findByOrderNumber(orderNumber: OrderNumber): Promise<Order | null> {
    const orderDoc = await this.orderModel.findOne({ 
      orderNumber: orderNumber.getValue() 
    });
    return orderDoc ? this.toDomain(orderDoc) : null;
  }

  public async findByUserId(userId: UserId): Promise<Order[]> {
    const orderDocs = await this.orderModel.find({ 
      userId: userId.toString() 
    }).sort({ createdAt: -1 });
    return orderDocs.map(doc => this.toDomain(doc));
  }

  public async findByStatus(status: OrderStatus): Promise<Order[]> {
    const orderDocs = await this.orderModel.find({ status });
    return orderDocs.map(doc => this.toDomain(doc));
  }

  public async findWithPagination(
    page: number,
    limit: number,
    filters?: {
      userId?: UserId;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      shippingStatus?: ShippingStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const query: any = {};

    // 应用过滤条件
    if (filters?.userId) {
      query.userId = filters.userId.toString();
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }
    
    if (filters?.shippingStatus) {
      query.shippingStatus = filters.shippingStatus;
    }
    
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;
    
    const [orderDocs, total] = await Promise.all([
      this.orderModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.orderModel.countDocuments(query)
    ]);

    return {
      orders: orderDocs.map(doc => this.toDomain(doc)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async existsByOrderNumber(orderNumber: OrderNumber): Promise<boolean> {
    const count = await this.orderModel.countDocuments({ 
      orderNumber: orderNumber.getValue() 
    });
    return count > 0;
  }

  public async delete(id: OrderId): Promise<void> {
    await this.orderModel.findByIdAndDelete(id.toString());
  }

  public async exists(id: OrderId): Promise<boolean> {
    const count = await this.orderModel.countDocuments({ _id: id.toString() });
    return count > 0;
  }

  public async countByStatus(status: OrderStatus): Promise<number> {
    return await this.orderModel.countDocuments({ status });
  }

  public async findOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    const orderDocs = await this.orderModel.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 });
    
    return orderDocs.map(doc => this.toDomain(doc));
  }

  public async getTotalSalesByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: [OrderStatus.COMPLETED, OrderStatus.SHIPPED] }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount.amount' }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalSales : 0;
  }

  public async findPendingPaymentOrders(): Promise<Order[]> {
    const orderDocs = await this.orderModel.find({
      paymentStatus: PaymentStatus.PENDING,
      createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // 30分钟前
    });
    
    return orderDocs.map(doc => this.toDomain(doc));
  }

  private toDocument(order: Order): any {
    const items = order.getItems().map(item => ({
      productId: item.getProductId().toString(),
      productName: item.getProductName(),
      productSku: item.getProductSku(),
      price: {
        amount: item.getPrice().getAmount(),
        currency: item.getPrice().getCurrency()
      },
      quantity: item.getQuantity().getValue(),
      subtotal: {
        amount: item.getSubtotal().getAmount(),
        currency: item.getSubtotal().getCurrency()
      }
    }));

    return {
      _id: order.getId().toString(),
      orderNumber: order.getOrderNumber().getValue(),
      userId: order.getUserId().toString(),
      items,
      totalAmount: {
        amount: order.getTotalAmount().getAmount(),
        currency: order.getTotalAmount().getCurrency()
      },
      shippingAddress: {
        street: order.getShippingAddress().getStreet(),
        city: order.getShippingAddress().getCity(),
        state: order.getShippingAddress().getState(),
        zipCode: order.getShippingAddress().getZipCode(),
        country: order.getShippingAddress().getCountry(),
        contactName: order.getShippingAddress().getContactName(),
        contactPhone: order.getShippingAddress().getContactPhone()
      },
      status: order.getStatus(),
      paymentStatus: order.getPaymentStatus(),
      shippingStatus: order.getShippingStatus(),
      createdAt: order.getCreatedAt(),
      updatedAt: order.getUpdatedAt()
    };
  }

  private toDomain(orderDoc: OrderDocument): Order {
    const items = orderDoc.items.map(item => {
      const price = Price.create(item.price.amount, item.price.currency as Currency);
      const quantity = Quantity.create(item.quantity);
      
      return OrderItem.create(
        ProductId.fromString(item.productId),
        item.productName,
        item.productSku,
        price,
        quantity
      );
    });

    const totalAmount = Money.create(
      orderDoc.totalAmount.amount,
      orderDoc.totalAmount.currency as Currency
    );

    const shippingAddress = Address.create({
      street: orderDoc.shippingAddress.street,
      city: orderDoc.shippingAddress.city,
      state: orderDoc.shippingAddress.state,
      zipCode: orderDoc.shippingAddress.zipCode,
      country: orderDoc.shippingAddress.country,
      contactName: orderDoc.shippingAddress.contactName,
      contactPhone: orderDoc.shippingAddress.contactPhone
    });

    return Order.fromPersistence(
      OrderId.fromString(orderDoc._id),
      OrderNumber.fromValue(orderDoc.orderNumber),
      UserId.fromString(orderDoc.userId),
      items,
      totalAmount,
      shippingAddress,
      orderDoc.status as OrderStatus,
      orderDoc.paymentStatus as PaymentStatus,
      orderDoc.shippingStatus as ShippingStatus,
      orderDoc.createdAt,
      orderDoc.updatedAt
    );
  }
} 