import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }
    
    next();
  };
};

// 别名导出，方便新代码使用
export const validate = validateRequest;

export const registerValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱是必填项',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .required()
    .messages({
      'string.min': '密码长度至少8个字符',
      'string.max': '密码长度不能超过128个字符',
      'string.pattern.base': '密码必须包含至少一个大写字母、一个小写字母、一个数字和一个特殊字符',
      'any.required': '密码是必填项',
    }),
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': '名字不能为空',
      'string.max': '名字长度不能超过50个字符',
      'any.required': '名字是必填项',
    }),
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': '姓氏不能为空',
      'string.max': '姓氏长度不能超过50个字符',
      'any.required': '姓氏是必填项',
    }),
});

export const loginValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '邮箱格式不正确',
      'any.required': '邮箱是必填项',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': '密码是必填项',
    }),
}); 