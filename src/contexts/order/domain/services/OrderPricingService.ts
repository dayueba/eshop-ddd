import { injectable } from 'inversify';
import { Money } from '../value-objects/Money';
import { Address } from '../value-objects/Address';
import { OrderItem } from '../entities/OrderItem';
import { Currency } from '../enums';

export interface OrderPricing {
  subtotal: Money;
  discountAmount: Money;
  shippingFee: Money;
  taxAmount: Money;
  totalAmount: Money;
}

export interface DiscountRule {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minOrderAmount?: Money;
  applicableCategories?: string[];
  maxDiscountAmount?: Money;
}

export interface ShippingRule {
  region: string;
  baseRate: Money;
  freeShippingThreshold?: Money;
  weightMultiplier?: number;
}

export interface TaxRule {
  region: string;
  rate: number; // 税率，如 0.1 表示 10%
  taxableCategories?: string[];
}

/**
 * 订单定价领域服务
 * 处理订单的复杂定价计算，包括折扣、运费、税费等
 */
@injectable()
export class OrderPricingService {
  
  /**
   * 计算订单完整定价
   */
  calculateOrderPricing(
    items: OrderItem[],
    shippingAddress: Address,
    couponCode?: string,
    currency: Currency = Currency.CNY
  ): OrderPricing {
    if (!items || items.length === 0) {
      throw new Error('订单项不能为空');
    }

    // 1. 计算小计
    const subtotal = this.calculateSubtotal(items);

    // 2. 计算折扣
    const discountAmount = this.calculateDiscount(items, subtotal, couponCode);

    // 3. 计算运费
    const shippingFee = this.calculateShippingFee(items, shippingAddress, subtotal, discountAmount);

    // 4. 计算税费
    const taxAmount = this.calculateTax(items, shippingAddress, subtotal, discountAmount);

    // 5. 计算总金额
    const totalAmount = subtotal
      .subtract(discountAmount)
      .add(shippingFee)
      .add(taxAmount);

    return {
      subtotal,
      discountAmount,
      shippingFee,
      taxAmount,
      totalAmount
    };
  }

  /**
   * 计算订单小计
   */
  private calculateSubtotal(items: OrderItem[]): Money {
    if (items.length === 0) {
      throw new Error('订单项不能为空');
    }

    let subtotal = Money.zero(items[0].getUnitPrice().getCurrency());
    for (const item of items) {
      subtotal = subtotal.add(item.getTotalPrice());
    }
    return subtotal;
  }

  /**
   * 计算折扣金额
   */
  private calculateDiscount(
    items: OrderItem[],
    subtotal: Money,
    couponCode?: string
  ): Money {
    if (!couponCode) {
      return Money.zero(subtotal.getCurrency());
    }

    // 这里可以根据优惠券代码获取折扣规则
    const discountRule = this.getDiscountRuleByCoupon(couponCode);
    if (!discountRule) {
      return Money.zero(subtotal.getCurrency());
    }

    return this.applyDiscountRule(items, subtotal, discountRule);
  }

  /**
   * 应用折扣规则
   */
  private applyDiscountRule(
    items: OrderItem[],
    subtotal: Money,
    rule: DiscountRule
  ): Money {
    // 检查最小订单金额
    if (rule.minOrderAmount && subtotal.isLessThan(rule.minOrderAmount)) {
      return Money.zero(subtotal.getCurrency());
    }

    let discountAmount: Money;

    switch (rule.type) {
      case 'PERCENTAGE':
        discountAmount = subtotal.multiply(rule.value / 100);
        break;
      
      case 'FIXED_AMOUNT':
        discountAmount = new Money(rule.value, subtotal.getCurrency());
        break;
      
      case 'FREE_SHIPPING':
        // 免运费折扣在运费计算中处理
        return Money.zero(subtotal.getCurrency());
      
      default:
        return Money.zero(subtotal.getCurrency());
    }

    // 应用最大折扣限制
    if (rule.maxDiscountAmount && discountAmount.isGreaterThan(rule.maxDiscountAmount)) {
      discountAmount = rule.maxDiscountAmount;
    }

    // 折扣不能超过订单金额
    if (discountAmount.isGreaterThan(subtotal)) {
      discountAmount = subtotal;
    }

    return discountAmount;
  }

  /**
   * 计算运费
   */
  private calculateShippingFee(
    items: OrderItem[],
    shippingAddress: Address,
    subtotal: Money,
    discountAmount: Money
  ): Money {
    const shippingRule = this.getShippingRuleByAddress(shippingAddress);
    if (!shippingRule) {
      // 默认运费
      return new Money(10, subtotal.getCurrency());
    }

    // 检查是否满足免运费条件
    const orderAmountAfterDiscount = subtotal.subtract(discountAmount);
    if (shippingRule.freeShippingThreshold && 
        orderAmountAfterDiscount.isGreaterThan(shippingRule.freeShippingThreshold)) {
      return Money.zero(subtotal.getCurrency());
    }

    // 计算基础运费
    let shippingFee = shippingRule.baseRate;

    // 如果有重量系数，根据商品总重量计算
    if (shippingRule.weightMultiplier) {
      const totalWeight = this.calculateTotalWeight(items);
      const weightCharge = new Money(totalWeight * shippingRule.weightMultiplier, subtotal.getCurrency());
      shippingFee = shippingFee.add(weightCharge);
    }

    return shippingFee;
  }

  /**
   * 计算税费
   */
  private calculateTax(
    items: OrderItem[],
    shippingAddress: Address,
    subtotal: Money,
    discountAmount: Money
  ): Money {
    const taxRule = this.getTaxRuleByAddress(shippingAddress);
    if (!taxRule) {
      return Money.zero(subtotal.getCurrency());
    }

    // 计算应税金额（小计 - 折扣）
    const taxableAmount = subtotal.subtract(discountAmount);
    
    // 如果指定了特定的应税分类，只对这些分类的商品征税
    if (taxRule.taxableCategories && taxRule.taxableCategories.length > 0) {
      // 这里需要根据商品分类过滤，简化实现
      return taxableAmount.multiply(taxRule.rate);
    }

    return taxableAmount.multiply(taxRule.rate);
  }

  /**
   * 验证订单定价的正确性
   */
  validateOrderPricing(
    items: OrderItem[],
    pricing: OrderPricing
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证小计计算
    const calculatedSubtotal = this.calculateSubtotal(items);
    if (!pricing.subtotal.equals(calculatedSubtotal)) {
      errors.push(`小计计算错误，期望: ${calculatedSubtotal.getAmount()}, 实际: ${pricing.subtotal.getAmount()}`);
    }

    // 验证总金额计算
    const calculatedTotal = pricing.subtotal
      .subtract(pricing.discountAmount)
      .add(pricing.shippingFee)
      .add(pricing.taxAmount);
    
    if (!pricing.totalAmount.equals(calculatedTotal)) {
      errors.push(`总金额计算错误，期望: ${calculatedTotal.getAmount()}, 实际: ${pricing.totalAmount.getAmount()}`);
    }

    // 验证折扣金额不能超过小计
    if (pricing.discountAmount.isGreaterThan(pricing.subtotal)) {
      errors.push('折扣金额不能超过订单小计');
    }

    // 验证所有金额都是非负数
    if (pricing.subtotal.getAmount() < 0) {
      errors.push('订单小计不能为负数');
    }
    if (pricing.discountAmount.getAmount() < 0) {
      errors.push('折扣金额不能为负数');
    }
    if (pricing.shippingFee.getAmount() < 0) {
      errors.push('运费不能为负数');
    }
    if (pricing.taxAmount.getAmount() < 0) {
      errors.push('税费不能为负数');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取优惠券折扣规则
   * 实际项目中这应该从数据库或缓存中获取
   */
  private getDiscountRuleByCoupon(couponCode: string): DiscountRule | null {
    // 模拟一些优惠券规则
    const mockRules: Record<string, DiscountRule> = {
      'SAVE10': {
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: new Money(100, Currency.CNY),
        maxDiscountAmount: new Money(50, Currency.CNY)
      },
      'WELCOME20': {
        type: 'FIXED_AMOUNT',
        value: 20,
        minOrderAmount: new Money(200, Currency.CNY)
      },
      'FREESHIP': {
        type: 'FREE_SHIPPING',
        value: 0,
        minOrderAmount: new Money(150, Currency.CNY)
      }
    };

    return mockRules[couponCode] || null;
  }

  /**
   * 根据地址获取运费规则
   */
  private getShippingRuleByAddress(address: Address): ShippingRule | null {
    // 根据地址获取运费规则，这里简化实现
    const province = address.getProvince();
    
    // 模拟一些运费规则
    if (['北京', '上海', '广州', '深圳'].includes(province)) {
      return {
        region: '一线城市',
        baseRate: new Money(8, Currency.CNY),
        freeShippingThreshold: new Money(199, Currency.CNY)
      };
    } else {
      return {
        region: '其他地区',
        baseRate: new Money(12, Currency.CNY),
        freeShippingThreshold: new Money(299, Currency.CNY),
        weightMultiplier: 2
      };
    }
  }

  /**
   * 根据地址获取税收规则
   */
  private getTaxRuleByAddress(address: Address): TaxRule | null {
    // 中国大陆地区一般不对个人消费征收销售税
    // 这里仅作为示例
    return null;
  }

  /**
   * 计算订单总重量
   */
  private calculateTotalWeight(items: OrderItem[]): number {
    // 这里需要从商品信息中获取重量
    // 简化实现，假设每个商品1kg
    return items.reduce((total, item) => total + item.getQuantity(), 0);
  }

  /**
   * 计算最优定价策略
   * 可以用于A/B测试或动态定价
   */
  calculateOptimalPricing(
    items: OrderItem[],
    shippingAddress: Address,
    availableCoupons: string[]
  ): { bestCoupon?: string; pricing: OrderPricing; savings: Money } {
    let bestPricing = this.calculateOrderPricing(items, shippingAddress);
    let bestCoupon: string | undefined;
    let maxSavings = Money.zero(bestPricing.totalAmount.getCurrency());

    // 尝试所有可用的优惠券
    for (const coupon of availableCoupons) {
      const pricingWithCoupon = this.calculateOrderPricing(items, shippingAddress, coupon);
      const savings = bestPricing.totalAmount.subtract(pricingWithCoupon.totalAmount);
      
      if (savings.isGreaterThan(maxSavings)) {
        maxSavings = savings;
        bestPricing = pricingWithCoupon;
        bestCoupon = coupon;
      }
    }

    return {
      bestCoupon,
      pricing: bestPricing,
      savings: maxSavings
    };
  }
} 