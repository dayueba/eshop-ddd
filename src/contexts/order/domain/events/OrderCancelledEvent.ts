import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class OrderCancelledEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
    public readonly cancelledAt: Date
  ) {
    super();
  }
} 