import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { environment } from './config/environment';
import { databaseConnection } from './config/database';
import { container, TYPES } from './config/container';
import { createUserRoutes } from './api/routes/UserRoutes';
import { cartRoutes } from './api/routes/CartRoutes';
import { productRoutes } from './api/routes/ProductRoutes';
import { orderRoutes } from './api/routes/OrderRoutes';
import { UserController } from './api/controllers/UserController';
import { CartController } from './api/controllers/CartController';
import { ProductController } from './api/controllers/ProductController';
import { OrderController } from './api/controllers/OrderController';
import { errorHandler, notFoundHandler } from './api/middleware/ErrorHandlerMiddleware';

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS配置
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }));

    // 压缩响应
    this.app.use(compression());

    // 限流中间件
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 限制每个IP最多100个请求
      message: {
        success: false,
        message: '请求过于频繁，请稍后再试',
      },
    });
    this.app.use(limiter);

    // 解析JSON请求体
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 请求日志中间件
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // 从容器获取控制器实例
    const userController = container.get<UserController>(TYPES.UserController);
    const cartController = container.get<CartController>(TYPES.CartController);
    const productController = container.get<ProductController>(TYPES.ProductController);
    const orderController = container.get<OrderController>(TYPES.OrderController);

    // API路由
    this.app.use(`${environment.api.prefix}/users`, createUserRoutes(userController));
    this.app.use(`${environment.api.prefix}/cart`, cartRoutes(cartController));
    this.app.use(`${environment.api.prefix}/products`, productRoutes(productController));
    this.app.use(`${environment.api.prefix}/orders`, orderRoutes);

    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: '服务运行正常',
        timestamp: new Date().toISOString(),
        environment: environment.nodeEnv,
        database: databaseConnection.getConnectionStatus() ? 'connected' : 'disconnected'
      });
    });

    // 根路径
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: '欢迎使用电子商城API',
        version: '1.0.0',
        documentation: '/api-docs',
      });
    });
  }

  private initializeSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: '电子商城API',
          version: '1.0.0',
          description: '基于DDD思想的电子商城系统API文档',
        },
        servers: [
          {
            url: `http://localhost:${environment.port}`,
            description: '开发服务器',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      apis: ['./src/api/routes/*.ts'],
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling(): void {
    // 404处理
    this.app.use('*', notFoundHandler);

    // 全局错误处理中间件
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 正在启动电子商城服务器...');
      
      // 连接数据库
      console.log('📊 正在连接数据库...');
      await databaseConnection.connect();
      
      // 等待数据库连接稳定
      await databaseConnection.waitForConnection();

      // 启动服务器
      this.app.listen(environment.port, () => {
        console.log('');
        console.log('🎉 服务器启动成功！');
        console.log('─'.repeat(50));
        console.log(`📍 服务地址: http://localhost:${environment.port}`);
        console.log(`📚 API文档: http://localhost:${environment.port}/api-docs`);
        console.log(`🌍 运行环境: ${environment.nodeEnv}`);
        console.log(`💾 数据库: ${databaseConnection.getConnectionStatus() ? '✅ 已连接' : '❌ 未连接'}`);
        console.log('');
        console.log('🛠️  可用的API端点:');
        console.log(`   POST ${environment.api.prefix}/users/register - 用户注册`);
        console.log(`   POST ${environment.api.prefix}/users/login - 用户登录`);
        console.log(`   GET  ${environment.api.prefix}/cart - 获取购物车`);
        console.log(`   POST ${environment.api.prefix}/cart/items - 添加商品到购物车`);
        console.log(`   POST ${environment.api.prefix}/products - 创建商品`);
        console.log(`   GET  ${environment.api.prefix}/products - 获取商品列表`);
        console.log(`   GET  ${environment.api.prefix}/products/:id - 获取商品详情`);
        console.log(`   POST ${environment.api.prefix}/products/categories - 创建分类`);
        console.log(`   GET  ${environment.api.prefix}/products/categories - 获取分类列表`);
        console.log(`   POST ${environment.api.prefix}/orders - 创建订单`);
        console.log(`   GET  ${environment.api.prefix}/orders - 获取订单列表`);
        console.log(`   GET  ${environment.api.prefix}/orders/:id - 获取订单详情`);
        console.log(`   PUT  ${environment.api.prefix}/orders/:id/cancel - 取消订单`);
        console.log(`   PUT  ${environment.api.prefix}/orders/:id/confirm-delivery - 确认收货`);
        console.log('─'.repeat(50));
      });
    } catch (error) {
      console.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// 启动服务器
const server = new Server();
server.start();

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  await databaseConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  await databaseConnection.disconnect();
  process.exit(0);
});

export default server; 