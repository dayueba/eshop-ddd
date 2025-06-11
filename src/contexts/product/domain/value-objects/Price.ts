import { ValueObject } from '../../../../shared/domain/ValueObject';
import { Currency } from '../enums';

interface PriceProps {
  amount: number;
  currency: Currency;
}

export class Price extends ValueObject<PriceProps> {
  constructor(amount: number, currency: Currency) {
    super({ amount, currency });
    this.validate();
  }

  private validate(): void {
    if (this.props.amount < 0) {
      throw new Error('价格不能为负数');
    }

    if (!Number.isFinite(this.props.amount)) {
      throw new Error('价格必须是有效数字');
    }

    // 验证精度（最多2位小数）
    const decimalPlaces = (this.props.amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new Error('价格精度最多2位小数');
    }

    if (!Object.values(Currency).includes(this.props.currency)) {
      throw new Error('不支持的货币类型');
    }
  }

  public getAmount(): number {
    return this.props.amount;
  }

  public getCurrency(): Currency {
    return this.props.currency;
  }

  public getFormattedPrice(): string {
    const symbols = {
      [Currency.CNY]: '¥',
      [Currency.USD]: '$',
      [Currency.EUR]: '€'
    };

    return `${symbols[this.props.currency]}${this.props.amount.toFixed(2)}`;
  }

  public add(other: Price): Price {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能对不同货币的价格进行运算');
    }
    return new Price(this.props.amount + other.props.amount, this.props.currency);
  }

  public subtract(other: Price): Price {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能对不同货币的价格进行运算');
    }
    const result = this.props.amount - other.props.amount;
    if (result < 0) {
      throw new Error('减法结果不能为负数');
    }
    return new Price(result, this.props.currency);
  }

  public multiply(factor: number): Price {
    if (factor < 0) {
      throw new Error('乘数不能为负数');
    }
    return new Price(
      Math.round(this.props.amount * factor * 100) / 100,
      this.props.currency
    );
  }

  public equals(other: Price): boolean {
    if (!other) return false;
    return this.props.amount === other.props.amount && 
           this.props.currency === other.props.currency;
  }

  public isGreaterThan(other: Price): boolean {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能比较不同货币的价格');
    }
    return this.props.amount > other.props.amount;
  }

  public isLessThan(other: Price): boolean {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能比较不同货币的价格');
    }
    return this.props.amount < other.props.amount;
  }

  public static zero(currency: Currency): Price {
    return new Price(0, currency);
  }

  public toJSON() {
    return {
      amount: this.props.amount,
      currency: this.props.currency,
      formattedPrice: this.getFormattedPrice()
    };
  }
} 