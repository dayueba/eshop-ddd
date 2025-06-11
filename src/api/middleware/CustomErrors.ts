/**
 * 自定义错误类
 * 提供更精确的错误分类和状态码控制
 */

export abstract class BaseError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly type: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    
    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 Bad Request - 请求参数错误
 */
export class ValidationError extends BaseError {
  public readonly statusCode = 400;
  public readonly type = 'ValidationError';

  constructor(message: string = '请求参数验证失败') {
    super(message);
  }
}

/**
 * 401 Unauthorized - 未认证
 */
export class UnauthorizedError extends BaseError {
  public readonly statusCode = 401;
  public readonly type = 'UnauthorizedError';

  constructor(message: string = '未认证的用户') {
    super(message);
  }
}

/**
 * 403 Forbidden - 权限不足
 */
export class ForbiddenError extends BaseError {
  public readonly statusCode = 403;
  public readonly type = 'ForbiddenError';

  constructor(message: string = '权限不足') {
    super(message);
  }
}

/**
 * 404 Not Found - 资源不存在
 */
export class NotFoundError extends BaseError {
  public readonly statusCode = 404;
  public readonly type = 'NotFoundError';

  constructor(message: string = '请求的资源不存在') {
    super(message);
  }
}

/**
 * 409 Conflict - 资源冲突
 */
export class ConflictError extends BaseError {
  public readonly statusCode = 409;
  public readonly type = 'ConflictError';

  constructor(message: string = '资源冲突') {
    super(message);
  }
}

/**
 * 422 Unprocessable Entity - 业务逻辑错误
 */
export class BusinessLogicError extends BaseError {
  public readonly statusCode = 422;
  public readonly type = 'BusinessLogicError';

  constructor(message: string = '业务逻辑错误') {
    super(message);
  }
}

/**
 * 500 Internal Server Error - 服务器内部错误
 */
export class InternalServerError extends BaseError {
  public readonly statusCode = 500;
  public readonly type = 'InternalServerError';

  constructor(message: string = '服务器内部错误') {
    super(message);
  }
}

// 领域特定错误类

/**
 * 用户相关错误
 */
export class UserNotFoundError extends NotFoundError {
  constructor(userId?: string) {
    super(userId ? `用户 ${userId} 不存在` : '用户不存在');
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`邮箱 ${email} 已被注册`);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('邮箱或密码错误');
  }
}

/**
 * 商品相关错误
 */
export class ProductNotFoundError extends NotFoundError {
  constructor(productId?: string) {
    super(productId ? `商品 ${productId} 不存在` : '商品不存在');
  }
}

export class ProductOutOfStockError extends BusinessLogicError {
  constructor(productName: string) {
    super(`商品 ${productName} 库存不足`);
  }
}

export class InvalidPriceError extends ValidationError {
  constructor() {
    super('商品价格必须大于0');
  }
}

/**
 * 订单相关错误
 */
export class OrderNotFoundError extends NotFoundError {
  constructor(orderId?: string) {
    super(orderId ? `订单 ${orderId} 不存在` : '订单不存在');
  }
}

export class OrderCannotBeCancelledError extends BusinessLogicError {
  constructor(orderStatus: string) {
    super(`订单状态为 ${orderStatus}，无法取消`);
  }
}

export class OrderAlreadyPaidError extends ConflictError {
  constructor() {
    super('订单已支付，无法修改');
  }
}

/**
 * 购物车相关错误
 */
export class CartNotFoundError extends NotFoundError {
  constructor() {
    super('购物车不存在');
  }
}

export class CartItemNotFoundError extends NotFoundError {
  constructor(productId: string) {
    super(`购物车中未找到商品 ${productId}`);
  }
}

export class InvalidQuantityError extends ValidationError {
  constructor() {
    super('商品数量必须大于0');
  }
}

/**
 * 分类相关错误
 */
export class CategoryNotFoundError extends NotFoundError {
  constructor(categoryId?: string) {
    super(categoryId ? `分类 ${categoryId} 不存在` : '分类不存在');
  }
}

export class CategoryAlreadyExistsError extends ConflictError {
  constructor(categoryName: string) {
    super(`分类 ${categoryName} 已存在`);
  }
}

/**
 * 文件上传相关错误
 */
export class FileTooLargeError extends ValidationError {
  constructor(maxSize: string) {
    super(`文件大小不能超过 ${maxSize}`);
  }
}

export class InvalidFileTypeError extends ValidationError {
  constructor(allowedTypes: string[]) {
    super(`文件类型不支持，仅支持：${allowedTypes.join(', ')}`);
  }
}

/**
 * 支付相关错误
 */
export class PaymentFailedError extends BusinessLogicError {
  constructor(reason?: string) {
    super(reason ? `支付失败：${reason}` : '支付失败');
  }
}

export class InvalidPaymentMethodError extends ValidationError {
  constructor() {
    super('不支持的支付方式');
  }
}

// 错误工厂函数，方便创建错误实例
export class ErrorFactory {
  static validation(message: string): ValidationError {
    return new ValidationError(message);
  }

  static unauthorized(message?: string): UnauthorizedError {
    return new UnauthorizedError(message);
  }

  static forbidden(message?: string): ForbiddenError {
    return new ForbiddenError(message);
  }

  static notFound(message?: string): NotFoundError {
    return new NotFoundError(message);
  }

  static conflict(message?: string): ConflictError {
    return new ConflictError(message);
  }

  static businessLogic(message?: string): BusinessLogicError {
    return new BusinessLogicError(message);
  }

  static internal(message?: string): InternalServerError {
    return new InternalServerError(message);
  }

  // 用户相关
  static userNotFound(userId?: string): UserNotFoundError {
    return new UserNotFoundError(userId);
  }

  static userAlreadyExists(email: string): UserAlreadyExistsError {
    return new UserAlreadyExistsError(email);
  }

  static invalidCredentials(): InvalidCredentialsError {
    return new InvalidCredentialsError();
  }

  // 商品相关
  static productNotFound(productId?: string): ProductNotFoundError {
    return new ProductNotFoundError(productId);
  }

  static productOutOfStock(productName: string): ProductOutOfStockError {
    return new ProductOutOfStockError(productName);
  }

  static invalidPrice(): InvalidPriceError {
    return new InvalidPriceError();
  }

  // 订单相关
  static orderNotFound(orderId?: string): OrderNotFoundError {
    return new OrderNotFoundError(orderId);
  }

  static orderCannotBeCancelled(orderStatus: string): OrderCannotBeCancelledError {
    return new OrderCannotBeCancelledError(orderStatus);
  }

  static orderAlreadyPaid(): OrderAlreadyPaidError {
    return new OrderAlreadyPaidError();
  }
} 