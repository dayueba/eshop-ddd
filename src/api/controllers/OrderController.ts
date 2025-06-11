import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { CreateOrderCommand, CreateOrderRequest } from '../../contexts/order/application/commands/CreateOrderCommand';
import { UpdateOrderStatusCommand, UpdateOrderStatusRequest } from '../../contexts/order/application/commands/UpdateOrderStatusCommand';
import { GetOrdersQuery, GetOrdersRequest } from '../../contexts/order/application/queries/GetOrdersQuery';
import { GetOrderByIdQuery, GetOrderByIdRequest } from '../../contexts/order/application/queries/GetOrderByIdQuery';
import { OrderStatus, PaymentStatus, ShippingStatus } from '../../contexts/order/domain/enums';
import { TYPES } from '../../config/container';

@injectable()
export class OrderController {
  constructor(
    @inject(TYPES.CreateOrderCommand) private createOrderCommand: CreateOrderCommand,
    @inject(TYPES.UpdateOrderStatusCommand) private updateOrderStatusCommand: UpdateOrderStatusCommand,
    @inject(TYPES.GetOrdersQuery) private getOrdersQuery: GetOrdersQuery,
    @inject(TYPES.GetOrderByIdQuery) private getOrderByIdQuery: GetOrderByIdQuery
  ) {}

  /**
   * 创建订单
   */
  public async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: '用户未认证' });
        return;
      }

      const request: CreateOrderRequest = {
        userId,
        cartId: req.body.cartId,
        shippingAddress: req.body.shippingAddress,
        currency: req.body.currency
      };

      const result = await this.createOrderCommand.execute(request);

      res.status(201).json({
        success: true,
        data: result,
        message: '订单创建成功'
      });
    } catch (error) {
      console.error('创建订单失败:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建订单失败'
      });
    }
  }

  /**
   * 获取订单列表
   */
  public async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      const request: GetOrdersRequest = {
        userId: isAdmin ? req.query.userId as string : userId, // 管理员可以查看所有用户订单
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        status: req.query.status as OrderStatus,
        paymentStatus: req.query.paymentStatus as PaymentStatus,
        shippingStatus: req.query.shippingStatus as ShippingStatus,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };

      const result = await this.getOrdersQuery.execute(request);

      res.json({
        success: true,
        data: result,
        message: '获取订单列表成功'
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取订单列表失败'
      });
    }
  }

  /**
   * 获取订单详情
   */
  public async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      const orderId = req.params.id;

      const request: GetOrderByIdRequest = {
        orderId,
        userId: isAdmin ? undefined : userId // 管理员不需要权限验证
      };

      const result = await this.getOrderByIdQuery.execute(request);

      if (!result.order) {
        res.status(404).json({
          success: false,
          error: '订单不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: result.order,
        message: '获取订单详情成功'
      });
    } catch (error) {
      console.error('获取订单详情失败:', error);
      const statusCode = error instanceof Error && error.message === '无权访问该订单' ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : '获取订单详情失败'
      });
    }
  }

  /**
   * 更新订单状态
   */
  public async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'admin';
      if (!isAdmin) {
        res.status(403).json({
          success: false,
          error: '权限不足，只有管理员可以更新订单状态'
        });
        return;
      }

      const orderId = req.params.id;
      const request: UpdateOrderStatusRequest = {
        orderId,
        status: req.body.status,
        paymentStatus: req.body.paymentStatus,
        shippingStatus: req.body.shippingStatus,
        trackingNumber: req.body.trackingNumber,
        reason: req.body.reason
      };

      const result = await this.updateOrderStatusCommand.execute(request);

      res.json({
        success: true,
        data: result,
        message: '订单状态更新成功'
      });
    } catch (error) {
      console.error('更新订单状态失败:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新订单状态失败'
      });
    }
  }

  /**
   * 取消订单
   */
  public async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';
      const orderId = req.params.id;

      // 验证权限：用户只能取消自己的订单，管理员可以取消任何订单
      if (!isAdmin) {
        const orderResult = await this.getOrderByIdQuery.execute({
          orderId,
          userId
        });

        if (!orderResult.order) {
          res.status(404).json({
            success: false,
            error: '订单不存在'
          });
          return;
        }
      }

      const request: UpdateOrderStatusRequest = {
        orderId,
        status: OrderStatus.CANCELLED,
        reason: req.body.reason || '用户取消'
      };

      const result = await this.updateOrderStatusCommand.execute(request);

      res.json({
        success: true,
        data: result,
        message: '订单取消成功'
      });
    } catch (error) {
      console.error('取消订单失败:', error);
      const statusCode = error instanceof Error && error.message === '无权访问该订单' ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : '取消订单失败'
      });
    }
  }

  /**
   * 确认收货
   */
  public async confirmDelivery(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const orderId = req.params.id;

      // 验证订单归属
      const orderResult = await this.getOrderByIdQuery.execute({
        orderId,
        userId
      });

      if (!orderResult.order) {
        res.status(404).json({
          success: false,
          error: '订单不存在'
        });
        return;
      }

      const request: UpdateOrderStatusRequest = {
        orderId,
        status: OrderStatus.COMPLETED,
        shippingStatus: ShippingStatus.DELIVERED
      };

      const result = await this.updateOrderStatusCommand.execute(request);

      res.json({
        success: true,
        data: result,
        message: '确认收货成功'
      });
    } catch (error) {
      console.error('确认收货失败:', error);
      const statusCode = error instanceof Error && error.message === '无权访问该订单' ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : '确认收货失败'
      });
    }
  }
} 