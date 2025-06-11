import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class ProductCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly categoryId: string,
    public readonly price: { amount: number; currency: string }
  ) {
    super();
  }
} 