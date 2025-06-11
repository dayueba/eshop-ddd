import { BaseDomainEvent } from '@shared/domain/DomainEvent';

export class UserLoggedInEvent extends BaseDomainEvent {
  public readonly email: string;
  public readonly loginTime: Date;

  constructor(userId: string, email: string) {
    super(userId, 'UserLoggedIn');
    this.email = email;
    this.loginTime = new Date();
  }
} 