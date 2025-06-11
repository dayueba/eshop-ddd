import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { 
  validateRequest, 
  registerValidationSchema, 
  loginValidationSchema 
} from '../middleware/ValidationMiddleware';
import { authenticateToken } from '../middleware/AuthMiddleware';

export const createUserRoutes = (userController: UserController) => {
  const router = Router();

  /**
   * @swagger
   * components:
   *   schemas:
   *     RegisterUserRequest:
   *       type: object
   *       required:
   *         - email
   *         - password
   *         - firstName
   *         - lastName
   *       properties:
   *         email:
   *           type: string
   *           format: email
   *           description: 邮箱地址
   *         password:
   *           type: string
   *           minLength: 8
   *           description: 密码（必须包含大小写字母、数字和特殊字符）
   *         firstName:
   *           type: string
   *           description: 名字
   *         lastName:
   *           type: string
   *           description: 姓氏
   *     
   *     LoginUserRequest:
   *       type: object
   *       required:
   *         - email
   *         - password
   *       properties:
   *         email:
   *           type: string
   *           format: email
   *         password:
   *           type: string
   *     
   *     UserResponse:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *         email:
   *           type: string
   *         firstName:
   *           type: string
   *         lastName:
   *           type: string
   *         createdAt:
   *           type: string
   *           format: date-time
   *   
   *   securitySchemes:
   *     bearerAuth:
   *       type: http
   *       scheme: bearer
   *       bearerFormat: JWT
   */

  /**
   * @swagger
   * /api/users/register:
   *   post:
   *     summary: 用户注册
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterUserRequest'
   *     responses:
   *       201:
   *         description: 注册成功
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
   *                   $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: 请求参数错误
   *       409:
   *         description: 邮箱已存在
   */
  router.post('/register', 
    validateRequest(registerValidationSchema), 
    userController.register.bind(userController)
  );

  /**
   * @swagger
   * /api/users/login:
   *   post:
   *     summary: 用户登录
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginUserRequest'
   *     responses:
   *       200:
   *         description: 登录成功
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
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     user:
   *                       $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 登录失败
   */
  router.post('/login', 
    validateRequest(loginValidationSchema), 
    userController.login.bind(userController)
  );

  /**
   * @swagger
   * /api/users/profile:
   *   get:
   *     summary: 获取用户信息
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 用户信息获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/UserResponse'
   *       401:
   *         description: 未授权
   *       404:
   *         description: 用户不存在
   */
  router.get('/profile', 
    authenticateToken, 
    userController.getProfile.bind(userController)
  );

  return router;
};