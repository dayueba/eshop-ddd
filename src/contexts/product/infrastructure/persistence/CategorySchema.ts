import { Schema, model, Document } from 'mongoose';

export interface CategoryDocument extends Document {
  _id: string;
  name: string;
  description: string;
  parentId?: string;
  level: number;
  path: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  parentId: {
    type: String,
    index: true,
    default: null
  },
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
    index: true
  },
  path: {
    type: String,
    required: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'categories'
});

// 复合索引
CategorySchema.index({ name: 1, parentId: 1 }, { unique: true });
CategorySchema.index({ parentId: 1, isActive: 1 });

// 验证：根分类不能有父分类
CategorySchema.pre('save', function(next) {
  if (this.level === 0 && this.parentId) {
    return next(new Error('根分类不能有父分类'));
  }
  if (this.level > 0 && !this.parentId) {
    return next(new Error('非根分类必须有父分类'));
  }
  next();
});

// 自动生成slug
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
  next();
});

export const CategoryModel = model<CategoryDocument>('Category', CategorySchema); 