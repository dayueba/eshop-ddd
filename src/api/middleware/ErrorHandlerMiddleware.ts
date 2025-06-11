import { Request, Response, NextFunction } from 'express';
import { environment } from '../../config/environment';
import { BaseError } from './CustomErrors';

/**
 * 异步错误捕获包装器
 * 用于包装异步路由处理器，自动捕获异步错误并传递给错误处理中间件
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 全局错误处理中间件
 * 统一处理所有错误，包括自定义错误和系统错误
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('错误详情:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 优先处理自定义错误类
  if (error instanceof BaseError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      type: error.type
    });
    return;
  }

  // 处理其他类型的错误（基于错误消息判断）
  if (isValidationError(error)) {
    res.status(400).json({
      success: false,
      message: error.message,
      type: 'ValidationError'
    });
    return;
  }

  if (isNotFoundError(error)) {
    res.status(404).json({
      success: false,
      message: error.message,
      type: 'NotFoundError'
    });
    return;
  }

  if (isUnauthorizedError(error)) {
    res.status(401).json({
      success: false,
      message: error.message,
      type: 'UnauthorizedError'
    });
    return;
  }

  if (isForbiddenError(error)) {
    res.status(403).json({
      success: false,
      message: error.message,
      type: 'ForbiddenError'
    });
    return;
  }

  if (isConflictError(error)) {
    res.status(409).json({
      success: false,
      message: error.message,
      type: 'ConflictError'
    });
    return;
  }

  // 默认为500内部服务器错误
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    type: 'InternalServerError',
    ...(environment.nodeEnv === 'development' && { 
      originalMessage: error.message,
      stack: error.stack 
    })
  });
};

/**
 * 404错误处理器
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl,
    method: req.method,
    type: 'NotFoundError'
  });
};

// 错误类型判断函数
function isValidationError(error: Error): boolean {
  return (
    error.message.includes('不能为空') ||
    error.message.includes('格式') ||
    error.message.includes('必须') ||
    error.message.includes('验证失败') ||
    error.message.includes('输入') ||
    error.message.includes('参数') ||
    error.message.includes('长度') ||
    error.message.includes('范围') ||
    error.name === 'ValidationError'
  );
}

function isNotFoundError(error: Error): boolean {
  return (
    error.message.includes('不存在') ||
    error.message.includes('未找到') ||
    error.message.includes('找不到') ||
    error.message === '商品不存在' ||
    error.message === '用户不存在' ||
    error.message === '订单不存在' ||
    error.name === 'NotFoundError'
  );
}

function isUnauthorizedError(error: Error): boolean {
  return (
    error.message.includes('未认证') ||
    error.message.includes('未登录') ||
    error.message.includes('登录失败') ||
    error.message.includes('token') ||
    error.message.includes('令牌') ||
    error.name === 'UnauthorizedError'
  );
}

function isForbiddenError(error: Error): boolean {
  return (
    error.message.includes('权限不足') ||
    error.message.includes('无权') ||
    error.message.includes('禁止') ||
    error.message.includes('权限') ||
    error.name === 'ForbiddenError'
  );
}

function isConflictError(error: Error): boolean {
  return (
    error.message.includes('已存在') ||
    error.message.includes('重复') ||
    error.message.includes('冲突') ||
    error.name === 'ConflictError'
  );
} 