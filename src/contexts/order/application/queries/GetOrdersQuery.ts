import { injectable, inject } from 'inversify';
import { Query } from '../../../../shared/application/UseCase';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { UserId } from '../../../user/domain/value-objects/UserId';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../../domain/enums';
import { TYPES } from '../../../../config/container';

export interface GetOrdersRequest {
  userId?: string;
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
  startDate?: string;
  endDate?: string;
}

export interface OrderItemDTO {
  productId: string;
  productName: string;
  productSku: string;
  price: {
    amount: number;
    currency: string;
  };
  quantity: number;
  subtotal: {
    amount: number;
    currency: string;
  };
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItemDTO[];
  totalAmount: {
    amount: number;
    currency: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetOrdersResponse {
  orders: OrderDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@injectable()
export class GetOrdersQuery implements Query<GetOrdersRequest, GetOrdersResponse> {
  constructor(
    @inject(TYPES.OrderRepository) private orderRepository: OrderRepository
  ) {}

  public async execute(request: GetOrdersRequest): Promise<GetOrdersResponse> {
    const page = request.page || 1;
    const limit = request.limit || 10;

    // 构建过滤条件
    const filters: any = {};
    
    if (request.userId) {
      filters.userId = UserId.fromString(request.userId);
    }
    
    if (request.status) {
      filters.status = request.status;
    }
    
    if (request.paymentStatus) {
      filters.paymentStatus = request.paymentStatus;
    }
    
    if (request.shippingStatus) {
      filters.shippingStatus = request.shippingStatus;
    }
    
    if (request.startDate) {
      filters.startDate = new Date(request.startDate);
    }
    
    if (request.endDate) {
      filters.endDate = new Date(request.endDate);
    }

    // 执行查询
    const result = await this.orderRepository.findWithPagination(
      page,
      limit,
      filters
    );

    // 转换为DTO
    const orderDTOs: OrderDTO[] = result.orders.map(order => ({
      id: order.getId().toString(),
      orderNumber: order.getOrderNumber().getValue(),
      userId: order.getUserId().toString(),
      items: order.getItems().map(item => ({
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
      })),
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
    }));

    return {
      orders: orderDTOs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  }
} 