import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class InventoryUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly productId: string,
    public readonly oldQuantity: number,
    public readonly newQuantity: number,
    public readonly reason: string
  ) {
    super();
  }
} 