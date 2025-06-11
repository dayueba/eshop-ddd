import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class OrderPaidEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly amount: { amount: number; currency: string; formattedAmount: string },
    public readonly paidAt: Date
  ) {
    super();
  }
} 