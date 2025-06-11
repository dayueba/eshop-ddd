export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

export abstract class BaseUseCase<TRequest, TResponse> implements UseCase<TRequest, TResponse> {
  public abstract execute(request: TRequest): Promise<TResponse>;
}

export interface Query<TResponse> {
  execute(): Promise<TResponse>;
}

export interface Command<TRequest> {
  execute(request: TRequest): Promise<void>;
} 