export enum OrderStatus {
  PENDING = 'pending',           // 待支付
  PAID = 'paid',                // 已支付
  PROCESSING = 'processing',     // 处理中
  SHIPPED = 'shipped',          // 已发货
  DELIVERED = 'delivered',      // 已送达
  CANCELLED = 'cancelled',      // 已取消
  REFUNDED = 'refunded',        // 已退款
  COMPLETED = 'completed'       // 已完成
}

export enum PaymentStatus {
  PENDING = 'pending',          // 待支付
  PROCESSING = 'processing',    // 支付中
  COMPLETED = 'completed',      // 支付完成
  FAILED = 'failed',           // 支付失败
  CANCELLED = 'cancelled',     // 支付取消
  REFUNDED = 'refunded'        // 已退款
}

export enum ShippingStatus {
  PENDING = 'pending',          // 待发货
  PREPARING = 'preparing',      // 备货中
  SHIPPED = 'shipped',         // 已发货
  IN_TRANSIT = 'in_transit',   // 运输中
  DELIVERED = 'delivered',     // 已送达
  EXCEPTION = 'exception'      // 异常
}

export enum PaymentMethod {
  ALIPAY = 'alipay',           // 支付宝
  WECHAT_PAY = 'wechat_pay',   // 微信支付
  BANK_CARD = 'bank_card',     // 银行卡
  CREDIT_CARD = 'credit_card', // 信用卡
  CASH_ON_DELIVERY = 'cod'     // 货到付款
}

export enum RefundStatus {
  PENDING = 'pending',         // 待处理
  PROCESSING = 'processing',   // 处理中
  COMPLETED = 'completed',     // 已完成
  FAILED = 'failed'           // 失败
} 