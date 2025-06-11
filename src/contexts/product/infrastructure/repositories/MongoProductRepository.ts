import { injectable } from 'inversify';
import { Model, model } from 'mongoose';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/aggregates/Product';
import { ProductId } from '../../domain/value-objects/ProductId';
import { CategoryId } from '../../domain/value-objects/CategoryId';
import { Price } from '../../domain/value-objects/Price';
import { SKU } from '../../domain/value-objects/SKU';
import { Inventory } from '../../domain/value-objects/Inventory';
import { ProductImage } from '../../domain/value-objects/ProductImage';
import { ProductStatus, Currency } from '../../domain/enums';
import { ProductSchema, ProductDocument } from '../persistence/ProductSchema';

@injectable()
export class MongoProductRepository implements ProductRepository {
  private productModel: Model<ProductDocument>;

  constructor() {
    this.productModel = model<ProductDocument>('Product', ProductSchema);
  }

  public async save(product: Product): Promise<void> {
    const productData = this.toDocument(product);
    
    await this.productModel.findByIdAndUpdate(
      productData._id,
      productData,
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
  }

  public async findById(id: ProductId): Promise<Product | null> {
    const productDoc = await this.productModel.findById(id.toString());
    return productDoc ? this.toDomain(productDoc) : null;
  }

  public async findBySKU(sku: SKU): Promise<Product | null> {
    const productDoc = await this.productModel.findOne({ sku: sku.getValue() });
    return productDoc ? this.toDomain(productDoc) : null;
  }

  public async findAll(): Promise<Product[]> {
    const productDocs = await this.productModel.find();
    return productDocs.map(doc => this.toDomain(doc));
  }

  public async findByCategory(categoryId: CategoryId): Promise<Product[]> {
    const productDocs = await this.productModel.find({ 
      categoryId: categoryId.toString() 
    });
    return productDocs.map(doc => this.toDomain(doc));
  }

  public async findByStatus(status: ProductStatus): Promise<Product[]> {
    const productDocs = await this.productModel.find({ status });
    return productDocs.map(doc => this.toDomain(doc));
  }

  public async findWithPagination(
    page: number, 
    limit: number, 
    filters?: {
      categoryId?: CategoryId;
      status?: ProductStatus;
      minPrice?: number;
      maxPrice?: number;
      searchTerm?: string;
    }
  ): Promise<{ products: Product[]; total: number; totalPages: number }> {
    const query: any = {};

    // 应用过滤条件
    if (filters?.categoryId) {
      query.categoryId = filters.categoryId.toString();
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    if (filters?.minPrice || filters?.maxPrice) {
      query['price.amount'] = {};
      if (filters.minPrice) query['price.amount'].$gte = filters.minPrice;
      if (filters.maxPrice) query['price.amount'].$lte = filters.maxPrice;
    }
    
    if (filters?.searchTerm) {
      query.$or = [
        { name: { $regex: filters.searchTerm, $options: 'i' } },
        { description: { $regex: filters.searchTerm, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [productDocs, total] = await Promise.all([
      this.productModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      this.productModel.countDocuments(query)
    ]);

    return {
      products: productDocs.map(doc => this.toDomain(doc)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async existsBySKU(sku: SKU): Promise<boolean> {
    const count = await this.productModel.countDocuments({ sku: sku.getValue() });
    return count > 0;
  }

  public async delete(id: ProductId): Promise<void> {
    await this.productModel.findByIdAndDelete(id.toString());
  }

  public async exists(id: ProductId): Promise<boolean> {
    const count = await this.productModel.countDocuments({ _id: id.toString() });
    return count > 0;
  }

  public async countByCategory(categoryId: CategoryId): Promise<number> {
    return await this.productModel.countDocuments({ 
      categoryId: categoryId.toString() 
    });
  }

  public async findLowStockProducts(threshold: number): Promise<Product[]> {
    const productDocs = await this.productModel.find({
      'inventory.available': { $lte: threshold }
    });
    return productDocs.map(doc => this.toDomain(doc));
  }

  private toDocument(product: Product): any {
    const images = product.getImages().map(img => ({
      url: img.getUrl(),
      alt: img.getAlt(),
      isPrimary: img.isPrimary()
    }));

    return {
      _id: product.getId().toString(),
      name: product.getName(),
      description: product.getDescription(),
      sku: product.getSKU().getValue(),
      price: {
        amount: product.getPrice().getAmount(),
        currency: product.getPrice().getCurrency()
      },
      categoryId: product.getCategoryId().toString(),
      inventory: {
        total: product.getInventory().getTotal(),
        available: product.getInventory().getAvailable(),
        reserved: product.getInventory().getReserved()
      },
      images,
      status: product.getStatus(),
      createdAt: product.getCreatedAt(),
      updatedAt: product.getUpdatedAt()
    };
  }

  private toDomain(productDoc: ProductDocument): Product {
    const price = Price.create(
      productDoc.price.amount, 
      productDoc.price.currency as Currency
    );
    
    const sku = SKU.fromValue(productDoc.sku);
    
    const inventory = Inventory.create(
      productDoc.inventory.total,
      productDoc.inventory.available,
      productDoc.inventory.reserved
    );

    const images = productDoc.images.map(img => 
      ProductImage.create(img.url, img.alt, img.isPrimary)
    );

    return Product.fromPersistence(
      ProductId.fromString(productDoc._id),
      productDoc.name,
      productDoc.description,
      sku,
      price,
      CategoryId.fromString(productDoc.categoryId),
      inventory,
      images,
      productDoc.status as ProductStatus,
      productDoc.createdAt,
      productDoc.updatedAt
    );
  }
} 