import { Order } from '../aggregates/Order';
import { OrderId } from '../OrderId';
import { OrderNumber } from '../value-objects/OrderNumber';
import { OrderStatus, PaymentStatus } from '../enums';

export interface OrderSearchCriteria {
  customerId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderNumber?: string;
  startDate?: Date;
  endDate?: Date;
  productId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'orderDate' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderRepository {
  // 基础 CRUD 操作
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByOrderNumber(orderNumber: OrderNumber): Promise<Order | null>;
  update(order: Order): Promise<void>;
  remove(order: Order): Promise<void>;

  // 查询方法
  findByCustomerId(customerId: string): Promise<Order[]>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
  findExpiredOrders(expireMinutes: number): Promise<Order[]>;
  search(criteria: OrderSearchCriteria): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }>;

  // 统计方法
  countByStatus(status: OrderStatus): Promise<number>;
  countByCustomerId(customerId: string): Promise<number>;
  getTotalSalesByCustomer(customerId: string): Promise<number>;
  getDailySalesStatistics(startDate: Date, endDate: Date): Promise<Array<{
    date: Date;
    orderCount: number;
    totalAmount: number;
  }>>;

  // 检查方法
  existsByOrderNumber(orderNumber: OrderNumber): Promise<boolean>;
  hasUnpaidOrdersByCustomer(customerId: string): Promise<boolean>;
} 