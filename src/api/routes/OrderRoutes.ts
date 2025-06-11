import { Router } from 'express';
import { container } from '../../config/container';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware } from '../middleware/AuthMiddleware';
import { validationMiddleware } from '../middleware/ValidationMiddleware';
import { body, param, query } from 'express-validator';
import { OrderStatus, PaymentStatus, ShippingStatus, Currency } from '../../contexts/order/domain/enums';

const router = Router();
const orderController = container.get<OrderController>('OrderController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - shippingAddress
 *       properties:
 *         cartId:
 *           type: string
 *           description: 购物车ID（可选，不提供则使用用户默认购物车）
 *         shippingAddress:
 *           type: object
 *           required:
 *             - street
 *             - city
 *             - state
 *             - zipCode
 *             - country
 *             - contactName
 *             - contactPhone
 *           properties:
 *             street:
 *               type: string
 *               description: 街道地址
 *             city:
 *               type: string
 *               description: 城市
 *             state:
 *               type: string
 *               description: 省份/州
 *             zipCode:
 *               type: string
 *               description: 邮政编码
 *             country:
 *               type: string
 *               description: 国家
 *             contactName:
 *               type: string
 *               description: 联系人姓名
 *             contactPhone:
 *               type: string
 *               description: 联系电话
 *         currency:
 *           type: string
 *           enum: [CNY, USD, EUR]
 *           description: 货币类型
 *     
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         productName:
 *           type: string
 *         productSku:
 *           type: string
 *         price:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *         quantity:
 *           type: integer
 *         subtotal:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *     
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderNumber:
 *           type: string
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *         shippingAddress:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *             contactName:
 *               type: string
 *             contactPhone:
 *               type: string
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, COMPLETED, CANCELLED]
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *         shippingStatus:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, RETURNED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: 创建订单
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: 订单创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     totalAmount:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 */
router.post(
  '/',
  authMiddleware,
  [
    body('shippingAddress.street').notEmpty().withMessage('街道地址不能为空'),
    body('shippingAddress.city').notEmpty().withMessage('城市不能为空'),
    body('shippingAddress.state').notEmpty().withMessage('省份不能为空'),
    body('shippingAddress.zipCode').notEmpty().withMessage('邮政编码不能为空'),
    body('shippingAddress.country').notEmpty().withMessage('国家不能为空'),
    body('shippingAddress.contactName').notEmpty().withMessage('联系人姓名不能为空'),
    body('shippingAddress.contactPhone').notEmpty().withMessage('联系电话不能为空'),
    body('currency').optional().isIn(Object.values(Currency)).withMessage('无效的货币类型')
  ],
  validationMiddleware,
  orderController.createOrder.bind(orderController)
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: 获取订单列表
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, COMPLETED, CANCELLED]
 *         description: 订单状态
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *         description: 支付状态
 *       - in: query
 *         name: shippingStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, RETURNED]
 *         description: 发货状态
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: 用户ID（仅管理员可用）
 *     responses:
 *       200:
 *         description: 获取订单列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                 message:
 *                   type: string
 */
router.get(
  '/',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(Object.values(OrderStatus)).withMessage('无效的订单状态'),
    query('paymentStatus').optional().isIn(Object.values(PaymentStatus)).withMessage('无效的支付状态'),
    query('shippingStatus').optional().isIn(Object.values(ShippingStatus)).withMessage('无效的发货状态')
  ],
  validationMiddleware,
  orderController.getOrders.bind(orderController)
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: 获取订单详情
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *     responses:
 *       200:
 *         description: 获取订单详情成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       404:
 *         description: 订单不存在
 *       403:
 *         description: 无权访问该订单
 */
router.get(
  '/:id',
  authMiddleware,
  [
    param('id').notEmpty().withMessage('订单ID不能为空')
  ],
  validationMiddleware,
  orderController.getOrderById.bind(orderController)
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: 更新订单状态（管理员）
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, COMPLETED, CANCELLED]
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID, FAILED, REFUNDED]
 *               shippingStatus:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, RETURNED]
 *               trackingNumber:
 *                 type: string
 *                 description: 物流跟踪号
 *               reason:
 *                 type: string
 *                 description: 状态变更原因
 *     responses:
 *       200:
 *         description: 订单状态更新成功
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 订单不存在
 */
router.put(
  '/:id/status',
  authMiddleware,
  [
    param('id').notEmpty().withMessage('订单ID不能为空'),
    body('status').optional().isIn(Object.values(OrderStatus)).withMessage('无效的订单状态'),
    body('paymentStatus').optional().isIn(Object.values(PaymentStatus)).withMessage('无效的支付状态'),
    body('shippingStatus').optional().isIn(Object.values(ShippingStatus)).withMessage('无效的发货状态')
  ],
  validationMiddleware,
  orderController.updateOrderStatus.bind(orderController)
);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: 取消订单
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 取消原因
 *     responses:
 *       200:
 *         description: 订单取消成功
 *       403:
 *         description: 无权取消该订单
 *       404:
 *         description: 订单不存在
 */
router.put(
  '/:id/cancel',
  authMiddleware,
  [
    param('id').notEmpty().withMessage('订单ID不能为空')
  ],
  validationMiddleware,
  orderController.cancelOrder.bind(orderController)
);

/**
 * @swagger
 * /api/orders/{id}/confirm-delivery:
 *   put:
 *     summary: 确认收货
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单ID
 *     responses:
 *       200:
 *         description: 确认收货成功
 *       403:
 *         description: 无权操作该订单
 *       404:
 *         description: 订单不存在
 */
router.put(
  '/:id/confirm-delivery',
  authMiddleware,
  [
    param('id').notEmpty().withMessage('订单ID不能为空')
  ],
  validationMiddleware,
  orderController.confirmDelivery.bind(orderController)
);

export { router as orderRoutes };