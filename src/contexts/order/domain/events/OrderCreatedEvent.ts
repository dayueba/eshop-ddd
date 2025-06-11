import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly customerId: string,
    public readonly totalAmount: { amount: number; currency: string; formattedAmount: string },
    public readonly items: Array<{
      productId: string;
      quantity: number;
      unitPrice: { amount: number; currency: string; formattedAmount: string };
    }>
  ) {
    super();
  }
} 