import { DomainEvent } from '../domain/DomainEvent';

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string, 
    handler: EventHandler<T>
  ): void;
}

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler<DomainEvent>[]> = new Map();

  public subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler as EventHandler<DomainEvent>);
  }

  public async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType);
    
    if (handlers) {
      const promises = handlers.map(handler => handler.handle(event));
      await Promise.all(promises);
    }
  }

  public async publishAll(events: DomainEvent[]): Promise<void> {
    const promises = events.map(event => this.publish(event));
    await Promise.all(promises);
  }
} 