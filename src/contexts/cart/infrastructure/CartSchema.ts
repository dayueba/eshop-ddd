import { Schema, Document } from 'mongoose';

export interface CartItemDocument {
  productId: string;
  productName: string;
  price: {
    amount: number;
    currency: string;
  };
  quantity: number;
  addedAt: Date;
}

export interface CartDocument extends Document {
  _id: string;
  userId: string;
  items: CartItemDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<CartItemDocument>({
  productId: {
    type: String,
    required: true,
    index: true
  },
  productName: {
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
      enum: ['CNY', 'USD', 'EUR'],
      default: 'CNY'
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 9999
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false // 不为子文档生成ID
});

export const CartSchema = new Schema<CartDocument>({
  _id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  items: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'carts',
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// 索引优化
CartSchema.index({ userId: 1 });
CartSchema.index({ 'items.productId': 1 });
CartSchema.index({ updatedAt: 1 });
CartSchema.index({ createdAt: 1 });

// 中间件：更新时间
CartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 虚拟字段：总价格
CartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.price.amount * item.quantity);
  }, 0);
});

// 虚拟字段：总商品数量
CartSchema.virtual('totalItemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 实例方法：检查是否为空
CartSchema.methods.isEmpty = function() {
  return this.items.length === 0;
};

// 实例方法：查找商品项
CartSchema.methods.findItemByProductId = function(productId: string) {
  return this.items.find(item => item.productId === productId);
};

// 静态方法：查找用户购物车
CartSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

// 静态方法：清理空购物车
CartSchema.statics.cleanupEmptyCarts = function(olderThan: Date) {
  return this.deleteMany({
    items: { $size: 0 },
    updatedAt: { $lt: olderThan }
  });
}; 