import { BaseDomainEvent } from '@shared/domain/DomainEvent';

export class UserRegisteredEvent extends BaseDomainEvent {
  public readonly email: string;

  constructor(userId: string, email: string) {
    super(userId, 'UserRegistered');
    this.email = email;
  }
} 