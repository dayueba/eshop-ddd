import { ValueObject } from '../../../../shared/domain/ValueObject';

export enum Currency {
  CNY = 'CNY',
  USD = 'USD',
  EUR = 'EUR'
}

interface MoneyProps {
  amount: number;
  currency: Currency;
}

export class Money extends ValueObject<MoneyProps> {
  constructor(amount: number, currency: Currency) {
    super({ amount, currency });
    this.validate();
  }

  private validate(): void {
    if (this.props.amount < 0) {
      throw new Error('金额不能为负数');
    }

    if (!Number.isFinite(this.props.amount)) {
      throw new Error('金额必须是有效数字');
    }

    // 验证精度（最多2位小数）
    const decimalPlaces = (this.props.amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new Error('金额精度最多2位小数');
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

  public getFormattedAmount(): string {
    const symbols = {
      [Currency.CNY]: '¥',
      [Currency.USD]: '$',
      [Currency.EUR]: '€'
    };

    return `${symbols[this.props.currency]}${this.props.amount.toFixed(2)}`;
  }

  public add(other: Money): Money {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能对不同货币进行运算');
    }
    return new Money(this.props.amount + other.props.amount, this.props.currency);
  }

  public subtract(other: Money): Money {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能对不同货币进行运算');
    }
    const result = this.props.amount - other.props.amount;
    if (result < 0) {
      throw new Error('减法结果不能为负数');
    }
    return new Money(result, this.props.currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('乘数不能为负数');
    }
    return new Money(
      Math.round(this.props.amount * factor * 100) / 100,
      this.props.currency
    );
  }

  public divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error('除数必须大于0');
    }
    return new Money(
      Math.round(this.props.amount / divisor * 100) / 100,
      this.props.currency
    );
  }

  public equals(other: Money): boolean {
    if (!other) return false;
    return this.props.amount === other.props.amount && 
           this.props.currency === other.props.currency;
  }

  public isGreaterThan(other: Money): boolean {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能比较不同货币');
    }
    return this.props.amount > other.props.amount;
  }

  public isLessThan(other: Money): boolean {
    if (this.props.currency !== other.props.currency) {
      throw new Error('不能比较不同货币');
    }
    return this.props.amount < other.props.amount;
  }

  public isZero(): boolean {
    return this.props.amount === 0;
  }

  public static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  public toJSON() {
    return {
      amount: this.props.amount,
      currency: this.props.currency,
      formattedAmount: this.getFormattedAmount()
    };
  }
} 