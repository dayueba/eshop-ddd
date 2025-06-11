import express from 'express';
import { ProductController } from '../controllers/ProductController';
import { validate } from '../middleware/ValidationMiddleware';
import { authMiddleware } from '../middleware/AuthMiddleware';
import Joi from 'joi';

// 创建商品验证Schema
const createProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(200).messages({
    'any.required': '商品名称为必填项',
    'string.min': '商品名称不能为空',
    'string.max': '商品名称长度不能超过200个字符'
  }),
  description: Joi.string().required().min(1).max(2000).messages({
    'any.required': '商品描述为必填项',
    'string.min': '商品描述不能为空',
    'string.max': '商品描述长度不能超过2000个字符'
  }),
  sku: Joi.string().required().pattern(/^[A-Z0-9-]+$/).messages({
    'any.required': 'SKU为必填项',
    'string.pattern.base': 'SKU格式无效，只能包含大写字母、数字和连字符'
  }),
  price: Joi.object({
    amount: Joi.number().positive().required().messages({
      'any.required': '价格为必填项',
      'number.positive': '价格必须为正数'
    }),
    currency: Joi.string().valid('CNY', 'USD', 'EUR').required().messages({
      'any.required': '货币类型为必填项',
      'any.only': '货币类型必须是CNY、USD或EUR之一'
    })
  }).required(),
  categoryId: Joi.string().required().messages({
    'any.required': '分类ID为必填项'
  }),
  inventory: Joi.object({
    total: Joi.number().integer().min(0).required().messages({
      'any.required': '总库存为必填项',
      'number.integer': '总库存必须为整数',
      'number.min': '总库存不能为负数'
    })
  }).required(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required().messages({
        'any.required': '图片URL为必填项',
        'string.uri': '图片URL格式无效'
      }),
      alt: Joi.string().allow('').max(200).messages({
        'string.max': '图片描述长度不能超过200个字符'
      }),
      isPrimary: Joi.boolean().default(false)
    })
  ).min(1).required().messages({
    'any.required': '商品图片为必填项',
    'array.min': '至少需要一张商品图片'
  })
});

// 更新商品验证Schema
const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).messages({
    'string.min': '商品名称不能为空',
    'string.max': '商品名称长度不能超过200个字符'
  }),
  description: Joi.string().min(1).max(2000).messages({
    'string.min': '商品描述不能为空',
    'string.max': '商品描述长度不能超过2000个字符'
  }),
  price: Joi.object({
    amount: Joi.number().positive().messages({
      'number.positive': '价格必须为正数'
    }),
    currency: Joi.string().valid('CNY', 'USD', 'EUR').messages({
      'any.only': '货币类型必须是CNY、USD或EUR之一'
    })
  }),
  categoryId: Joi.string(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().allow('').max(200),
      isPrimary: Joi.boolean().default(false)
    })
  ),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK').messages({
    'any.only': '商品状态必须是ACTIVE、INACTIVE或OUT_OF_STOCK之一'
  })
});

// 创建分类验证Schema
const createCategorySchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    'any.required': '分类名称为必填项',
    'string.min': '分类名称不能为空',
    'string.max': '分类名称长度不能超过100个字符'
  }),
  description: Joi.string().required().min(1).max(500).messages({
    'any.required': '分类描述为必填项',
    'string.min': '分类描述不能为空',
    'string.max': '分类描述长度不能超过500个字符'
  }),
  level: Joi.string().valid('PRIMARY', 'SECONDARY').required().messages({
    'any.required': '分类级别为必填项',
    'any.only': '分类级别必须是PRIMARY或SECONDARY'
  }),
  parentId: Joi.string().when('level', {
    is: 'SECONDARY',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }).messages({
    'any.required': '二级分类必须指定父分类',
    'any.unknown': '一级分类不能指定父分类'
  }),
  displayOrder: Joi.number().integer().min(0).default(0).messages({
    'number.integer': '显示顺序必须为整数',
    'number.min': '显示顺序不能为负数'
  })
});

export const productRoutes = (productController: ProductController) => {
  const router = express.Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     Product:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *         name:
   *           type: string
   *         description:
   *           type: string
   *         sku:
   *           type: string
   *         price:
   *           type: object
   *           properties:
   *             amount:
   *               type: number
   *             currency:
   *               type: string
   *         categoryId:
   *           type: string
   *         inventory:
   *           type: object
   *           properties:
   *             total:
   *               type: number
   *             available:
   *               type: number
   *             reserved:
   *               type: number
   *         images:
   *           type: array
   *           items:
   *             type: object
   *             properties:
   *               url:
   *                 type: string
   *               alt:
   *                 type: string
   *               isPrimary:
   *                 type: boolean
   *         status:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, OUT_OF_STOCK]
   *         createdAt:
   *           type: string
   *           format: date-time
   *         updatedAt:
   *           type: string
   *           format: date-time
   *     
   *     Category:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *         name:
   *           type: string
   *         description:
   *           type: string
   *         level:
   *           type: string
   *           enum: [PRIMARY, SECONDARY]
   *         parentId:
   *           type: string
   *           nullable: true
   *         displayOrder:
   *           type: number
   *         isActive:
   *           type: boolean
   *         createdAt:
   *           type: string
   *           format: date-time
   *         updatedAt:
   *           type: string
   *           format: date-time
   */

  // 商品管理路由
  
  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: 创建商品
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - description
   *               - sku
   *               - price
   *               - categoryId
   *               - inventory
   *               - images
   *             properties:
   *               name:
   *                 type: string
   *                 description: 商品名称
   *               description:
   *                 type: string
   *                 description: 商品描述
   *               sku:
   *                 type: string
   *                 description: 商品SKU
   *               price:
   *                 type: object
   *                 properties:
   *                   amount:
   *                     type: number
   *                     description: 价格
   *                   currency:
   *                     type: string
   *                     enum: [CNY, USD, EUR]
   *                     description: 货币类型
   *               categoryId:
   *                 type: string
   *                 description: 分类ID
   *               inventory:
   *                 type: object
   *                 properties:
   *                   total:
   *                     type: number
   *                     description: 总库存
   *               images:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       description: 图片URL
   *                     alt:
   *                       type: string
   *                       description: 图片描述
   *                     isPrimary:
   *                       type: boolean
   *                       description: 是否为主图
   *     responses:
   *       201:
   *         description: 商品创建成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   */
  router.post('/', 
    authMiddleware,
    validate(createProductSchema),
    productController.createProduct
  );

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: 获取商品列表
   *     tags: [Products]
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
   *         name: categoryId
   *         schema:
   *           type: string
   *         description: 分类ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, OUT_OF_STOCK]
   *         description: 商品状态
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *         description: 最低价格
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *         description: 最高价格
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: 搜索关键词
   *     responses:
   *       200:
   *         description: 商品列表获取成功
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
   *                     products:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Product'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: number
   *                         limit:
   *                           type: number
   *                         total:
   *                           type: number
   *                         totalPages:
   *                           type: number
   */
  router.get('/', productController.getProducts);

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: 获取商品详情
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 商品ID
   *     responses:
   *       200:
   *         description: 商品详情获取成功
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
   *                   $ref: '#/components/schemas/Product'
   *       404:
   *         description: 商品不存在
   */
  router.get('/:id', productController.getProductById);

  /**
   * @swagger
   * /api/products/{id}:
   *   put:
   *     summary: 更新商品
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               price:
   *                 type: object
   *                 properties:
   *                   amount:
   *                     type: number
   *                   currency:
   *                     type: string
   *               categoryId:
   *                 type: string
   *               images:
   *                 type: array
   *                 items:
   *                   type: object
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, OUT_OF_STOCK]
   *     responses:
   *       200:
   *         description: 商品更新成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 商品不存在
   */
  router.put('/:id',
    authMiddleware,
    validate(updateProductSchema),
    productController.updateProduct
  );

  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: 删除商品
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 商品ID
   *     responses:
   *       200:
   *         description: 商品删除成功
   *       400:
   *         description: 删除失败
   *       401:
   *         description: 未授权
   *       404:
   *         description: 商品不存在
   */
  router.delete('/:id',
    authMiddleware,
    productController.deleteProduct
  );

  // 分类管理路由

  /**
   * @swagger
   * /api/products/categories:
   *   post:
   *     summary: 创建分类
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - description
   *               - level
   *             properties:
   *               name:
   *                 type: string
   *                 description: 分类名称
   *               description:
   *                 type: string
   *                 description: 分类描述
   *               level:
   *                 type: string
   *                 enum: [PRIMARY, SECONDARY]
   *                 description: 分类级别
   *               parentId:
   *                 type: string
   *                 description: 父分类ID（二级分类必填）
   *               displayOrder:
   *                 type: number
   *                 description: 显示顺序
   *     responses:
   *       201:
   *         description: 分类创建成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   */
  router.post('/categories',
    authMiddleware,
    validate(createCategorySchema),
    productController.createCategory
  );

  /**
   * @swagger
   * /api/products/categories:
   *   get:
   *     summary: 获取分类列表
   *     tags: [Categories]
   *     parameters:
   *       - in: query
   *         name: level
   *         schema:
   *           type: string
   *           enum: [PRIMARY, SECONDARY]
   *         description: 分类级别
   *       - in: query
   *         name: parentId
   *         schema:
   *           type: string
   *         description: 父分类ID
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: 是否激活
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: 页码
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: 每页数量
   *     responses:
   *       200:
   *         description: 分类列表获取成功
   */
  router.get('/categories', productController.getCategories);

  /**
   * @swagger
   * /api/products/categories/{id}:
   *   put:
   *     summary: 更新分类
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 分类ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: 分类名称
   *               description:
   *                 type: string
   *                 description: 分类描述
   *               displayOrder:
   *                 type: number
   *                 description: 显示顺序
   *               isActive:
   *                 type: boolean
   *                 description: 是否激活
   *     responses:
   *       200:
   *         description: 分类更新成功
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 分类不存在
   */
  router.put('/categories/:id',
    authMiddleware,
    productController.updateCategory
  );

  /**
   * @swagger
   * /api/products/categories/tree:
   *   get:
   *     summary: 获取分类树
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: 分类树获取成功
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
   *                     categories:
   *                       type: array
   *                       items:
   *                         allOf:
   *                           - $ref: '#/components/schemas/Category'
   *                           - type: object
   *                             properties:
   *                               children:
   *                                 type: array
   *                                 items:
   *                                   $ref: '#/components/schemas/Category'
   */
  router.get('/categories/tree', productController.getCategoryTree);

  return router;
}; 