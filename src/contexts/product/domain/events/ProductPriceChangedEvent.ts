import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';
import { Price } from '../value-objects/Price';

export class ProductPriceChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly productId: string,
    public readonly oldPrice: Price,
    public readonly newPrice: Price
  ) {
    super();
  }
} 