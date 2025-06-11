import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class OrderDeliveredEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly deliveredAt: Date
  ) {
    super();
  }
} 