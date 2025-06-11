import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class CategoryDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly categoryId: string,
    public readonly name: string
  ) {
    super();
  }
} 