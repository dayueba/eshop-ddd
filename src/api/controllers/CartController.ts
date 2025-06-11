import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { AddItemToCartCommand } from '../../contexts/cart/application/commands/AddItemToCartCommand';
import { RemoveItemFromCartCommand } from '../../contexts/cart/application/commands/RemoveItemFromCartCommand';
import { GetCartQuery } from '../../contexts/cart/application/queries/GetCartQuery';
import { TYPES } from '../../config/container';

@injectable()
export class CartController {
  constructor(
    @inject(TYPES.AddItemToCartCommand) private readonly addItemToCartCommand: AddItemToCartCommand,
    @inject(TYPES.RemoveItemFromCartCommand) private readonly removeItemFromCartCommand: RemoveItemFromCartCommand,
    @inject(TYPES.GetCartQuery) private readonly getCartQuery: GetCartQuery
  ) {}

  public async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const result = await this.getCartQuery.execute({ userId });
      
      if (!result) {
        res.status(200).json({
          success: true,
          message: '购物车为空',
          data: {
            cartId: null,
            userId,
            items: [],
            totalItemCount: 0,
            totalPrice: 0,
            currency: 'CNY',
            isEmpty: true
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: '获取购物车成功',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async addItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const { productId, productName, price, currency = 'CNY', quantity } = req.body;

      const result = await this.addItemToCartCommand.execute({
        userId,
        productId,
        productName,
        price,
        currency,
        quantity
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          cartItemCount: result.cartItemCount,
          totalPrice: result.totalPrice
        }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const { productId } = req.params;

      const result = await this.removeItemFromCartCommand.execute({
        userId,
        productId
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          cartItemCount: result.cartItemCount,
          totalPrice: result.totalPrice
        }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async updateItemQuantity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        // 如果数量为0或负数，则移除商品
        const result = await this.removeItemFromCartCommand.execute({
          userId,
          productId
        });

        res.status(200).json({
          success: true,
          message: '商品已移除',
          data: {
            cartItemCount: result.cartItemCount,
            totalPrice: result.totalPrice
          }
        });
        return;
      }

      // 这里需要实现更新数量的命令，暂时使用添加商品的逻辑
      res.status(501).json({
        success: false,
        message: '更新商品数量功能待实现'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: '用户未认证'
        });
        return;
      }

      // 这里需要实现清空购物车的命令
      res.status(501).json({
        success: false,
        message: '清空购物车功能待实现'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: Error, res: Response): void {
    console.error('Cart controller error:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('格式') ||
        error.message.includes('必须大于0')) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else if (error.message.includes('未找到') || 
               error.message.includes('不存在')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
} 