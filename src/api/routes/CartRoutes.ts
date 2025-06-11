import express from 'express';
import { CartController } from '../controllers/CartController';
import { authMiddleware } from '../middleware/AuthMiddleware';
import { validate } from '../middleware/ValidationMiddleware';
import Joi from 'joi';

// 添加商品到购物车的验证Schema
const addItemToCartSchema = Joi.object({
  productId: Joi.string().required().messages({
    'any.required': '商品ID为必填项',
    'string.empty': '商品ID不能为空'
  }),
  productName: Joi.string().required().trim().messages({
    'any.required': '商品名称为必填项',
    'string.empty': '商品名称不能为空'
  }),
  price: Joi.number().positive().required().messages({
    'any.required': '商品价格为必填项',
    'number.positive': '商品价格必须大于0'
  }),
  currency: Joi.string().valid('CNY', 'USD', 'EUR').default('CNY').messages({
    'any.only': '货币类型必须是CNY、USD或EUR之一'
  }),
  quantity: Joi.number().integer().min(1).max(9999).required().messages({
    'any.required': '商品数量为必填项',
    'number.integer': '商品数量必须为整数',
    'number.min': '商品数量必须大于0',
    'number.max': '商品数量不能超过9999'
  })
});

// 更新商品数量的验证Schema
const updateQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(9999).required().messages({
    'any.required': '商品数量为必填项',
    'number.integer': '商品数量必须为整数',
    'number.min': '商品数量不能为负数',
    'number.max': '商品数量不能超过9999'
  })
});

export const cartRoutes = (cartController: CartController) => {
  const router = express.Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     CartItem:
   *       type: object
   *       properties:
   *         productId:
   *           type: string
   *           description: 商品ID
   *         productName:
   *           type: string
   *           description: 商品名称
   *         price:
   *           type: number
   *           description: 商品单价
   *         currency:
   *           type: string
   *           enum: [CNY, USD, EUR]
   *           description: 货币类型
   *         quantity:
   *           type: integer
   *           minimum: 1
   *           maximum: 9999
   *           description: 商品数量
   *         totalPrice:
   *           type: number
   *           description: 该商品的总价
   *         addedAt:
   *           type: string
   *           format: date-time
   *           description: 添加时间
   *     
   *     Cart:
   *       type: object
   *       properties:
   *         cartId:
   *           type: string
   *           description: 购物车ID
   *         userId:
   *           type: string
   *           description: 用户ID
   *         items:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/CartItem'
   *           description: 购物车商品列表
   *         totalItemCount:
   *           type: integer
   *           description: 商品总数量
   *         totalPrice:
   *           type: number
   *           description: 购物车总价
   *         currency:
   *           type: string
   *           description: 货币类型
   *         isEmpty:
   *           type: boolean
   *           description: 是否为空购物车
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: 创建时间
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: 更新时间
   *     
   *     AddItemRequest:
   *       type: object
   *       required:
   *         - productId
   *         - productName
   *         - price
   *         - quantity
   *       properties:
   *         productId:
   *           type: string
   *           description: 商品ID
   *         productName:
   *           type: string
   *           description: 商品名称
   *         price:
   *           type: number
   *           minimum: 0.01
   *           description: 商品价格
   *         currency:
   *           type: string
   *           enum: [CNY, USD, EUR]
   *           default: CNY
   *           description: 货币类型
   *         quantity:
   *           type: integer
   *           minimum: 1
   *           maximum: 9999
   *           description: 商品数量
   */

  /**
   * @swagger
   * /api/cart:
   *   get:
   *     summary: 获取用户购物车
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取购物车
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Cart'
   *       401:
   *         description: 用户未认证
   */
  router.get('/', 
    authMiddleware,
    cartController.getCart.bind(cartController)
  );

  /**
   * @swagger
   * /api/cart/items:
   *   post:
   *     summary: 添加商品到购物车
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddItemRequest'
   *     responses:
   *       200:
   *         description: 成功添加商品到购物车
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     cartItemCount:
   *                       type: integer
   *                     totalPrice:
   *                       type: number
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 用户未认证
   */
  router.post('/items',
    authMiddleware,
    validate(addItemToCartSchema),
    cartController.addItem.bind(cartController)
  );

  /**
   * @swagger
   * /api/cart/items/{productId}:
   *   delete:
   *     summary: 从购物车移除商品
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *         description: 商品ID
   *     responses:
   *       200:
   *         description: 成功移除商品
   *       401:
   *         description: 用户未认证
   *       404:
   *         description: 商品未找到
   */
  router.delete('/items/:productId',
    authMiddleware,
    cartController.removeItem.bind(cartController)
  );

  /**
   * @swagger
   * /api/cart/items/{productId}/quantity:
   *   put:
   *     summary: 更新购物车商品数量
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *         description: 商品ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - quantity
   *             properties:
   *               quantity:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 9999
   *                 description: 新的商品数量（0表示移除）
   *     responses:
   *       200:
   *         description: 成功更新数量
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 用户未认证
   *       404:
   *         description: 商品未找到
   */
  router.put('/items/:productId/quantity',
    authMiddleware,
    validate(updateQuantitySchema),
    cartController.updateItemQuantity.bind(cartController)
  );

  /**
   * @swagger
   * /api/cart/clear:
   *   delete:
   *     summary: 清空购物车
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功清空购物车
   *       401:
   *         description: 用户未认证
   */
  router.delete('/clear',
    authMiddleware,
    cartController.clearCart.bind(cartController)
  );

  return router;
}; 