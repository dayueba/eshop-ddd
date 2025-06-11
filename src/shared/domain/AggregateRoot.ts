import { Entity } from './Entity';
import { DomainEvent } from './DomainEvent';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  public getUncommittedEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  public hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }
} 