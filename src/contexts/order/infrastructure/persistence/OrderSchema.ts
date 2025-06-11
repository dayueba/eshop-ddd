import { Schema, model, Document } from 'mongoose';

export interface OrderDocument extends Document {
  _id: string;
  orderNumber: string;
  customerId: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: {
      amount: number;
      currency: string;
    };
    totalPrice: {
      amount: number;
      currency: string;
    };
    discountAmount: {
      amount: number;
      currency: string;
    };
    productSnapshot: {
      name: string;
      description: string;
      imageUrl: string;
      attributes?: Record<string, any>;
    };
  }>;
  shippingAddress: {
    country: string;
    province: string;
    city: string;
    district: string;
    street: string;
    zipCode: string;
    contactName: string;
    contactPhone: string;
  };
  billingAddress: {
    country: string;
    province: string;
    city: string;
    district: string;
    street: string;
    zipCode: string;
    contactName: string;
    contactPhone: string;
  };
  pricing: {
    subtotal: {
      amount: number;
      currency: string;
    };
    discount: {
      amount: number;
      currency: string;
    };
    shippingFee: {
      amount: number;
      currency: string;
    };
    tax: {
      amount: number;
      currency: string;
    };
    total: {
      amount: number;
      currency: string;
    };
  };
  paymentMethod: string;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  orderDate: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  metadata: {
    couponCode?: string;
    promotionId?: string;
    channel: string;
    userAgent?: string;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  country: {
    type: String,
    required: true,
    trim: true
  },
  province: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    match: /^\d{6}$/
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    match: /^1[3-9]\d{9}$/
  }
}, { _id: false });

const MoneySchema = new Schema({
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
}, { _id: false });

const OrderItemSchema = new Schema({
  id: {
    type: String,
    required: true
  },
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
  sku: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: MoneySchema,
  totalPrice: MoneySchema,
  discountAmount: MoneySchema,
  productSnapshot: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed
    }
  }
}, { _id: false });

const OrderSchema = new Schema<OrderDocument>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{14}$/,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: function(items: any[]) {
        return items && items.length > 0;
      },
      message: '订单必须包含至少一个商品'
    }
  },
  shippingAddress: {
    type: AddressSchema,
    required: true
  },
  billingAddress: {
    type: AddressSchema,
    required: true
  },
  pricing: {
    subtotal: MoneySchema,
    discount: MoneySchema,
    shippingFee: MoneySchema,
    tax: MoneySchema,
    total: MoneySchema
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['alipay', 'wechat_pay', 'bank_card', 'credit_card', 'cod']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'completed'],
    default: 'pending',
    index: true
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  shippingStatus: {
    type: String,
    required: true,
    enum: ['pending', 'preparing', 'shipped', 'in_transit', 'delivered', 'exception'],
    default: 'pending',
    index: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  paidAt: {
    type: Date,
    index: true
  },
  shippedAt: {
    type: Date,
    index: true
  },
  deliveredAt: {
    type: Date,
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  metadata: {
    couponCode: {
      type: String,
      trim: true
    },
    promotionId: {
      type: String,
      trim: true
    },
    channel: {
      type: String,
      required: true,
      default: 'web'
    },
    userAgent: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  collection: 'orders'
});

// 复合索引
OrderSchema.index({ customerId: 1, orderDate: -1 });
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ status: 1, orderDate: -1 });
OrderSchema.index({ paymentStatus: 1, orderDate: -1 });
OrderSchema.index({ 'pricing.total.amount': 1 });
OrderSchema.index({ orderDate: 1 });
OrderSchema.index({ 'items.productId': 1 });

// 文本搜索索引
OrderSchema.index({ 
  orderNumber: 'text',
  'items.productName': 'text',
  'items.sku': 'text'
});

// 验证中间件
OrderSchema.pre('save', function(next) {
  // 验证订单项总价计算
  for (const item of this.items) {
    const expectedTotal = item.unitPrice.amount * item.quantity - item.discountAmount.amount;
    if (Math.abs(item.totalPrice.amount - expectedTotal) > 0.01) {
      return next(new Error(`订单项 ${item.productName} 总价计算错误`));
    }
  }

  // 验证订单总金额计算
  const subtotal = this.items.reduce((sum, item) => sum + item.totalPrice.amount, 0);
  if (Math.abs(this.pricing.subtotal.amount - subtotal) > 0.01) {
    return next(new Error('订单小计计算错误'));
  }

  const expectedTotal = this.pricing.subtotal.amount - this.pricing.discount.amount + 
                       this.pricing.shippingFee.amount + this.pricing.tax.amount;
  if (Math.abs(this.pricing.total.amount - expectedTotal) > 0.01) {
    return next(new Error('订单总金额计算错误'));
  }

  // 状态一致性验证
  if (this.status === 'paid' && this.paymentStatus !== 'completed') {
    return next(new Error('订单状态与支付状态不一致'));
  }

  if (this.status === 'shipped' && this.shippingStatus !== 'shipped') {
    return next(new Error('订单状态与发货状态不一致'));
  }

  next();
});

export const OrderModel = model<OrderDocument>('Order', OrderSchema); 