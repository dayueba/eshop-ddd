import { BaseDomainEvent } from '../../../../shared/domain/DomainEvent';

export class CategoryCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly categoryId: string,
    public readonly name: string,
    public readonly parentId?: string
  ) {
    super();
  }
} 