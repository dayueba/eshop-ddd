import { Container } from 'inversify';
import 'reflect-metadata';

// 用户模块
import { UserRepository } from '../contexts/user/domain/repositories/UserRepository';
import { MongoUserRepository } from '../contexts/user/infrastructure/repositories/MongoUserRepository';
import { RegisterUserCommand } from '../contexts/user/application/commands/RegisterUserCommand';
import { LoginUserCommand } from '../contexts/user/application/commands/LoginUserCommand';
import { UserController } from '../api/controllers/UserController';

// 购物车模块
import { CartRepository } from '../contexts/cart/domain/repositories/CartRepository';
import { MongoCartRepository } from '../contexts/cart/infrastructure/MongoCartRepository';
import { AddItemToCartCommand } from '../contexts/cart/application/commands/AddItemToCartCommand';
import { RemoveItemFromCartCommand } from '../contexts/cart/application/commands/RemoveItemFromCartCommand';
import { GetCartQuery } from '../contexts/cart/application/queries/GetCartQuery';
import { CartController } from '../api/controllers/CartController';

// 商品模块
import { ProductRepository } from '../contexts/product/domain/repositories/ProductRepository';
import { CategoryRepository } from '../contexts/product/domain/repositories/CategoryRepository';
import { MongoProductRepository } from '../contexts/product/infrastructure/repositories/MongoProductRepository';
import { MongoCategoryRepository } from '../contexts/product/infrastructure/repositories/MongoCategoryRepository';
import { CreateProductCommand } from '../contexts/product/application/commands/CreateProductCommand';
import { UpdateProductCommand } from '../contexts/product/application/commands/UpdateProductCommand';
import { DeleteProductCommand } from '../contexts/product/application/commands/DeleteProductCommand';
import { CreateCategoryCommand } from '../contexts/product/application/commands/CreateCategoryCommand';
import { UpdateCategoryCommand } from '../contexts/product/application/commands/UpdateCategoryCommand';
import { GetProductsQuery } from '../contexts/product/application/queries/GetProductsQuery';
import { GetProductByIdQuery } from '../contexts/product/application/queries/GetProductByIdQuery';
import { GetCategoriesQuery } from '../contexts/product/application/queries/GetCategoriesQuery';
import { ProductController } from '../api/controllers/ProductController';

// 订单模块
import { OrderRepository } from '../contexts/order/domain/repositories/OrderRepository';
import { MongoOrderRepository } from '../contexts/order/infrastructure/repositories/MongoOrderRepository';
import { CreateOrderCommand } from '../contexts/order/application/commands/CreateOrderCommand';
import { UpdateOrderStatusCommand } from '../contexts/order/application/commands/UpdateOrderStatusCommand';
import { GetOrdersQuery } from '../contexts/order/application/queries/GetOrdersQuery';
import { GetOrderByIdQuery } from '../contexts/order/application/queries/GetOrderByIdQuery';
import { OrderController } from '../api/controllers/OrderController';

// 共享服务
import { EventBus } from '../shared/domain/EventBus';
import { EventStore } from '../shared/domain/EventStore';
import { MongoEventStore } from '../shared/infrastructure/MongoEventStore';
import { eventDrivenConfig } from './event-config';

// 领域服务
import { InventoryService } from '../contexts/product/domain/services/InventoryService';
import { OrderPricingService } from '../contexts/order/domain/services/OrderPricingService';
import { UserUniquenessService } from '../contexts/user/domain/services/UserUniquenessService';

// 定义容器标识符
export const TYPES = {
  // 用户模块
  UserRepository: Symbol.for('UserRepository'),
  RegisterUserCommand: Symbol.for('RegisterUserCommand'),
  LoginUserCommand: Symbol.for('LoginUserCommand'),
  UserController: Symbol.for('UserController'),

  // 购物车模块
  CartRepository: Symbol.for('CartRepository'),
  AddItemToCartCommand: Symbol.for('AddItemToCartCommand'),
  RemoveItemFromCartCommand: Symbol.for('RemoveItemFromCartCommand'),
  GetCartQuery: Symbol.for('GetCartQuery'),
  CartController: Symbol.for('CartController'),

  // 商品模块
  ProductRepository: Symbol.for('ProductRepository'),
  CategoryRepository: Symbol.for('CategoryRepository'),
  CreateProductCommand: Symbol.for('CreateProductCommand'),
  UpdateProductCommand: Symbol.for('UpdateProductCommand'),
  DeleteProductCommand: Symbol.for('DeleteProductCommand'),
  CreateCategoryCommand: Symbol.for('CreateCategoryCommand'),
  UpdateCategoryCommand: Symbol.for('UpdateCategoryCommand'),
  GetProductsQuery: Symbol.for('GetProductsQuery'),
  GetProductByIdQuery: Symbol.for('GetProductByIdQuery'),
  GetCategoriesQuery: Symbol.for('GetCategoriesQuery'),
  ProductController: Symbol.for('ProductController'),

  // 订单模块
  OrderRepository: Symbol.for('OrderRepository'),
  CreateOrderCommand: Symbol.for('CreateOrderCommand'),
  UpdateOrderStatusCommand: Symbol.for('UpdateOrderStatusCommand'),
  GetOrdersQuery: Symbol.for('GetOrdersQuery'),
  GetOrderByIdQuery: Symbol.for('GetOrderByIdQuery'),
  OrderController: Symbol.for('OrderController'),

  // 共享服务
  EventBus: Symbol.for('EventBus'),
  EventStore: Symbol.for('EventStore'),

  // 领域服务
  InventoryService: Symbol.for('InventoryService'),
  OrderPricingService: Symbol.for('OrderPricingService'),
  UserUniquenessService: Symbol.for('UserUniquenessService')
};

// 创建容器
const container = new Container();

// 绑定用户模块依赖
container.bind<UserRepository>(TYPES.UserRepository).to(MongoUserRepository).inSingletonScope();
container.bind<RegisterUserCommand>(TYPES.RegisterUserCommand).to(RegisterUserCommand);
container.bind<LoginUserCommand>(TYPES.LoginUserCommand).to(LoginUserCommand);
container.bind<UserController>(TYPES.UserController).to(UserController);

// 绑定购物车模块依赖
container.bind<CartRepository>(TYPES.CartRepository).to(MongoCartRepository).inSingletonScope();
container.bind<AddItemToCartCommand>(TYPES.AddItemToCartCommand).to(AddItemToCartCommand);
container.bind<RemoveItemFromCartCommand>(TYPES.RemoveItemFromCartCommand).to(RemoveItemFromCartCommand);
container.bind<GetCartQuery>(TYPES.GetCartQuery).to(GetCartQuery);
container.bind<CartController>(TYPES.CartController).to(CartController);

// 绑定商品模块依赖
container.bind<ProductRepository>(TYPES.ProductRepository).to(MongoProductRepository).inSingletonScope();
container.bind<CategoryRepository>(TYPES.CategoryRepository).to(MongoCategoryRepository).inSingletonScope();
container.bind<CreateProductCommand>(TYPES.CreateProductCommand).to(CreateProductCommand);
container.bind<UpdateProductCommand>(TYPES.UpdateProductCommand).to(UpdateProductCommand);
container.bind<DeleteProductCommand>(TYPES.DeleteProductCommand).to(DeleteProductCommand);
container.bind<CreateCategoryCommand>(TYPES.CreateCategoryCommand).to(CreateCategoryCommand);
container.bind<UpdateCategoryCommand>(TYPES.UpdateCategoryCommand).to(UpdateCategoryCommand);
container.bind<GetProductsQuery>(TYPES.GetProductsQuery).to(GetProductsQuery);
container.bind<GetProductByIdQuery>(TYPES.GetProductByIdQuery).to(GetProductByIdQuery);
container.bind<GetCategoriesQuery>(TYPES.GetCategoriesQuery).to(GetCategoriesQuery);
container.bind<ProductController>(TYPES.ProductController).to(ProductController);

// 绑定订单模块依赖
container.bind<OrderRepository>(TYPES.OrderRepository).to(MongoOrderRepository).inSingletonScope();
container.bind<CreateOrderCommand>(TYPES.CreateOrderCommand).to(CreateOrderCommand);
container.bind<UpdateOrderStatusCommand>(TYPES.UpdateOrderStatusCommand).to(UpdateOrderStatusCommand);
container.bind<GetOrdersQuery>(TYPES.GetOrdersQuery).to(GetOrdersQuery);
container.bind<GetOrderByIdQuery>(TYPES.GetOrderByIdQuery).to(GetOrderByIdQuery);
container.bind<OrderController>(TYPES.OrderController).to(OrderController);

// 绑定共享服务
container.bind<EventStore>(TYPES.EventStore).to(MongoEventStore).inSingletonScope();
container.bind<EventBus>(TYPES.EventBus).toDynamicValue(() => {
  return eventDrivenConfig.getEventBus();
}).inSingletonScope();

// 绑定领域服务
container.bind<InventoryService>(TYPES.InventoryService).to(InventoryService).inSingletonScope();
container.bind<OrderPricingService>(TYPES.OrderPricingService).to(OrderPricingService).inSingletonScope();
container.bind<UserUniquenessService>(TYPES.UserUniquenessService).to(UserUniquenessService).inSingletonScope();

export { container }; 