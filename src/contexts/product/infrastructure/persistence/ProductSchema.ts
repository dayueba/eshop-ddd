import { Schema, model, Document } from 'mongoose';

export interface ProductDocument extends Document {
  _id: string;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  sku: string;
  categoryId: string;
  inventory: {
    quantity: number;
    reserved: number;
    minStockLevel: number;
  };
  images: Array<{
    url: string;
    alt: string;
    order: number;
    isPrimary: boolean;
  }>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<ProductDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      enum: ['CNY', 'USD', 'EUR']
    }
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Za-z0-9]{8,20}$/
  },
  categoryId: {
    type: String,
    required: true,
    index: true
  },
  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minStockLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true,
      min: 0
    },
    isPrimary: {
      type: Boolean,
      required: true,
      default: false
    }
  }],
  status: {
    type: String,
    required: true,
    enum: ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'draft',
    index: true
  }
}, {
  timestamps: true,
  collection: 'products'
});

// 索引
ProductSchema.index({ name: 1 });
ProductSchema.index({ categoryId: 1, status: 1 });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ 'price.amount': 1 });
ProductSchema.index({ 'inventory.quantity': 1 });
ProductSchema.index({ name: 'text', description: 'text' });

// 验证：确保有且仅有一张主图
ProductSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length !== 1) {
      return next(new Error('必须有且仅有一张主图'));
    }
  }
  next();
});

// 验证：预留库存不能超过总库存
ProductSchema.pre('save', function(next) {
  if (this.inventory.reserved > this.inventory.quantity) {
    return next(new Error('预留库存不能超过总库存'));
  }
  next();
});

export const ProductModel = model<ProductDocument>('Product', ProductSchema);