import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';
import { ProductStatus } from '../enums';

export class ProductStatusChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly productId: string,
    public readonly oldStatus: ProductStatus,
    public readonly newStatus: ProductStatus
  ) {
    super();
  }
} 