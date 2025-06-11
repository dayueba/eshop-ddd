# 电子商城DDD项目

基于领域驱动设计(DDD)思想，使用Express + TypeScript实现的电子商城系统。

## 🎯 项目特性

- 🏗️ **DDD架构**: 采用领域驱动设计思想，清晰的有界上下文划分
- 🔄 **依赖注入**: 使用Inversify实现IoC容器，松耦合架构
- 🛒 **购物车系统**: 完整的购物车管理功能
- 🔐 **JWT认证**: 基于JWT的用户认证和授权系统
- 📝 **输入验证**: 使用Joi进行严格的输入验证
- 📚 **API文档**: 集成Swagger自动生成API文档
- 🛡️ **安全防护**: 集成Helmet、CORS、限流等安全中间件
- 📊 **数据库**: MongoDB + Mongoose ODM
- 🧪 **测试支持**: Jest + Supertest测试框架
- 🎯 **TypeScript**: 完整的TypeScript类型支持

## 📋 功能状态

### ✅ 已完成模块
- **用户管理**: 注册、登录、认证 (100%)
- **购物车**: 添加商品、移除商品、查看购物车 (95%)
- **系统集成**: 依赖注入、数据库连接、错误处理 (100%)

### 🔄 进行中
- **商品管理**: 领域层完成，应用层实现中 (60%)
- **订单管理**: 领域层完成，应用层待实现 (40%)

### 📅 计划中
- **支付系统**: 支付流程处理
- **物流管理**: 发货状态跟踪
- **商品搜索**: 搜索和筛选功能

## 🏗️ 项目结构

```
src/
├── shared/                 # 共享内核
│   ├── domain/            # 领域层基础组件
│   ├── infrastructure/    # 基础设施层组件
│   └── application/       # 应用层基础组件
├── contexts/              # 有界上下文
│   ├── user/             # 用户上下文 ✅
│   ├── cart/             # 购物车上下文 ✅
│   ├── product/          # 商品上下文 🔄
│   └── order/            # 订单上下文 🔄
├── api/                   # API层
│   ├── controllers/      # 控制器
│   ├── middleware/       # 中间件
│   └── routes/           # 路由
├── config/               # 配置
│   ├── container.ts      # 依赖注入容器 ✅
│   ├── database.ts       # 数据库连接 ✅
│   └── environment.ts    # 环境配置
└── server.ts             # 服务器入口
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MongoDB 4.4+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量示例文件：
```bash
cp env.example .env
```

2. 编辑 `.env` 文件，配置数据库连接等信息：
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/eshop-ddd
JWT_SECRET=your-super-secret-jwt-key
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

**预期输出**:
```
🚀 正在启动电子商城服务器...
📊 正在连接数据库...
✅ 数据库连接成功

🎉 服务器启动成功！
──────────────────────────────────────────────────
📍 服务地址: http://localhost:3000
📚 API文档: http://localhost:3000/api-docs
🌍 运行环境: development
💾 数据库: ✅ 已连接

🛠️  可用的API端点:
   POST /api/users/register - 用户注册
   POST /api/users/login - 用户登录
   GET  /api/cart - 获取购物车
   POST /api/cart/items - 添加商品到购物车
──────────────────────────────────────────────────
```

### API文档

启动服务器后，访问 http://localhost:3000/api-docs 查看完整的API文档

## 🛠️ 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器
- `npm test` - 运行测试
- `npm run test:watch` - 监视模式运行测试
- `npm run test:coverage` - 生成测试覆盖率报告
- `npm run lint` - 代码检查
- `npm run lint:fix` - 自动修复代码问题
- `npm run format` - 代码格式化

## 🔌 API端点

### 用户管理
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息

### 购物车管理 🛒
- `GET /api/cart` - 获取用户购物车
- `POST /api/cart/items` - 添加商品到购物车
- `DELETE /api/cart/items/:productId` - 移除购物车商品
- `PUT /api/cart/items/:productId/quantity` - 更新商品数量
- `DELETE /api/cart/clear` - 清空购物车

### 系统监控
- `GET /health` - 健康检查（包含数据库状态）
- `GET /` - API信息

## 💡 使用示例

### 用户注册

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "张",
    "lastName": "三"
  }'
```

### 用户登录

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### 添加商品到购物车

```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-123",
    "productName": "示例商品",
    "price": 99.99,
    "currency": "CNY", 
    "quantity": 2
  }'
```

### 获取购物车

```bash
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏛️ 架构设计

### 领域驱动设计(DDD)

项目采用DDD设计，包含以下核心概念：

- **实体(Entity)**: 具有唯一标识的领域对象
- **值对象(Value Object)**: 不可变的值类型
- **聚合根(Aggregate Root)**: 聚合的入口点
- **仓储(Repository)**: 数据持久化抽象
- **领域事件(Domain Event)**: 领域中发生的重要事件
- **应用服务(Application Service)**: 编排领域对象完成业务用例

### CQRS模式

使用命令查询职责分离模式：
- **命令(Command)**: 处理写操作
- **查询(Query)**: 处理读操作

### 依赖注入模式

使用Inversify IoC容器实现：
- **接口驱动**: 依赖于抽象而非具体实现
- **构造函数注入**: 通过构造函数注入依赖
- **生命周期管理**: 单例、瞬态等不同生命周期
- **类型安全**: TypeScript装饰器支持

## 🧪 测试

运行所有测试：
```bash
npm test
```

运行特定测试：
```bash
npm test -- --testNamePattern="User"
```

生成测试覆盖率：
```bash
npm run test:coverage
```

## 🚀 部署

### 构建项目

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### Docker部署

```bash
# 构建镜像
docker build -t eshop-ddd .

# 运行容器
docker run -p 3000:3000 -e MONGODB_URI=your_mongo_uri eshop-ddd
```

## 📚 文档导航

### 📖 设计文档
- [项目设计文档](doc/项目设计文档.md) - 完整的技术架构设计
- [分步实现文档](doc/分步实现文档.md) - 12个阶段的详细实施计划
- [商品模块设计文档](doc/商品模块设计文档.md) - 商品模块详细设计
- [订单模块设计文档](doc/订单模块设计文档.md) - 订单模块详细设计

### 📋 进度文档
- [系统集成完成状态](doc/系统集成完成状态.md) - 当前集成状态和功能演示
- [项目实现状态总结](doc/项目实现状态总结.md) - 各模块完成度统计

### 🔧 开发指南
- [开发规范](.cursor/rules/development-guidelines.mdc) - 代码规范和最佳实践
- [API开发模式](.cursor/rules/api-patterns.mdc) - API设计模式
- [测试指南](.cursor/rules/testing-guidelines.mdc) - 测试策略和规范

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

项目链接: [https://github.com/yourusername/eshop-ddd](https://github.com/yourusername/eshop-ddd)

---

⚡ **系统当前状态**: 可用于开发和测试，用户认证和购物车功能完整可用 