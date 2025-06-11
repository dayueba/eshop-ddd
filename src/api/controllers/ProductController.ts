import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { CreateProductCommand, CreateProductRequest } from '../../contexts/product/application/commands/CreateProductCommand';
import { UpdateProductCommand, UpdateProductRequest } from '../../contexts/product/application/commands/UpdateProductCommand';
import { GetProductsQuery, GetProductsRequest } from '../../contexts/product/application/queries/GetProductsQuery';
import { GetProductByIdQuery, GetProductByIdRequest } from '../../contexts/product/application/queries/GetProductByIdQuery';
import { CreateCategoryCommand, CreateCategoryRequest } from '../../contexts/product/application/commands/CreateCategoryCommand';
import { UpdateCategoryCommand, UpdateCategoryRequest } from '../../contexts/product/application/commands/UpdateCategoryCommand';
import { DeleteProductCommand, DeleteProductRequest } from '../../contexts/product/application/commands/DeleteProductCommand';
import { GetCategoriesQuery, GetCategoriesRequest } from '../../contexts/product/application/queries/GetCategoriesQuery';
import { TYPES } from '../../config/container';

@injectable()
export class ProductController {
  constructor(
    @inject(TYPES.CreateProductCommand) private createProductCommand: CreateProductCommand,
    @inject(TYPES.UpdateProductCommand) private updateProductCommand: UpdateProductCommand,
    @inject(TYPES.DeleteProductCommand) private deleteProductCommand: DeleteProductCommand,
    @inject(TYPES.GetProductsQuery) private getProductsQuery: GetProductsQuery,
    @inject(TYPES.GetProductByIdQuery) private getProductByIdQuery: GetProductByIdQuery,
    @inject(TYPES.CreateCategoryCommand) private createCategoryCommand: CreateCategoryCommand,
    @inject(TYPES.UpdateCategoryCommand) private updateCategoryCommand: UpdateCategoryCommand,
    @inject(TYPES.GetCategoriesQuery) private getCategoriesQuery: GetCategoriesQuery
  ) {}

  // 商品相关接口
  public createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CreateProductRequest = req.body;
      await this.createProductCommand.execute(request);

      res.status(201).json({
        success: true,
        message: '商品创建成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '创建商品失败'
      });
    }
  };

  public updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: UpdateProductRequest = {
        productId: req.params.id,
        ...req.body
      };
      
      await this.updateProductCommand.execute(request);

      res.status(200).json({
        success: true,
        message: '商品更新成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新商品失败'
      });
    }
  };

  public getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetProductsRequest = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        categoryId: req.query.categoryId as string,
        status: req.query.status as any,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        searchTerm: req.query.search as string
      };

      const response = await this.getProductsQuery.execute(request);

      res.status(200).json({
        success: true,
        message: '获取商品列表成功',
        data: response
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取商品列表失败'
      });
    }
  };

  public getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetProductByIdRequest = {
        productId: req.params.id
      };

      const response = await this.getProductByIdQuery.execute(request);

      res.status(200).json({
        success: true,
        message: '获取商品详情成功',
        data: response
      });
    } catch (error: any) {
      if (error.message === '商品不存在') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || '获取商品详情失败'
      });
    }
  };

  // 分类相关接口
  public createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: CreateCategoryRequest = req.body;
      await this.createCategoryCommand.execute(request);

      res.status(201).json({
        success: true,
        message: '分类创建成功'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '创建分类失败'
      });
    }
  };

  public getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: GetCategoriesRequest = {
        level: req.query.level as any,
        parentId: req.query.parentId as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const response = await this.getCategoriesQuery.execute(request);

      res.status(200).json({
        success: true,
        message: '获取分类列表成功',
        data: response
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取分类列表失败'
      });
    }
  };

  public getCategoryTree = async (req: Request, res: Response): Promise<void> => {
    try {
      // 获取顶级分类
      const topCategories = await this.getCategoriesQuery.execute({
        level: 'PRIMARY' as any,
        isActive: true
      });

      // 为每个顶级分类获取子分类
      const tree = await Promise.all(
        topCategories.categories.map(async (category) => {
          const children = await this.getCategoriesQuery.execute({
            parentId: category.id,
            isActive: true
          });

          return {
            ...category,
            children: children.categories
          };
        })
      );

      res.status(200).json({
        success: true,
        message: '获取分类树成功',
        data: { categories: tree }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || '获取分类树失败'
      });
    }
  };

  public deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: DeleteProductRequest = {
        productId: req.params.id
      };

      const result = await this.deleteProductCommand.execute(request);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      if (error.message === '商品不存在') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || '删除商品失败'
      });
    }
  };

  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: UpdateCategoryRequest = {
        categoryId: req.params.id,
        ...req.body
      };

      const result = await this.updateCategoryCommand.execute(request);

      res.status(200).json({
        success: true,
        message: '分类更新成功',
        data: result
      });
    } catch (error: any) {
      if (error.message === '分类不存在') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error.message || '更新分类失败'
      });
    }
  };
} 