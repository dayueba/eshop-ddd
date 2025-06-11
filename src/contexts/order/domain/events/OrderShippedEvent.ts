import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class OrderShippedEvent extends BaseDomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly shipmentId: string,
    public readonly trackingNumber: string,
    public readonly carrier: string
  ) {
    super();
  }
} 