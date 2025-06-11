import { ValueObject } from '../../../../shared/domain/ValueObject';

interface ProductImageProps {
  url: string;
  alt: string;
  order: number;
  isPrimary: boolean;
}

export class ProductImage extends ValueObject<ProductImageProps> {
  constructor(url: string, alt: string, order: number, isPrimary: boolean = false) {
    super({ url, alt, order, isPrimary });
    this.validate();
  }

  private validate(): void {
    if (!this.props.url || typeof this.props.url !== 'string') {
      throw new Error('图片URL不能为空');
    }

    // 验证URL格式
    try {
      new URL(this.props.url);
    } catch {
      throw new Error('图片URL格式无效');
    }

    if (!this.props.alt || typeof this.props.alt !== 'string') {
      throw new Error('图片描述不能为空');
    }

    if (this.props.order < 0) {
      throw new Error('图片排序不能为负数');
    }

    if (typeof this.props.isPrimary !== 'boolean') {
      throw new Error('isPrimary必须是布尔值');
    }
  }

  public getUrl(): string {
    return this.props.url;
  }

  public getAlt(): string {
    return this.props.alt;
  }

  public getOrder(): number {
    return this.props.order;
  }

  public isPrimaryImage(): boolean {
    return this.props.isPrimary;
  }

  public updateOrder(order: number): ProductImage {
    if (order < 0) {
      throw new Error('图片排序不能为负数');
    }

    return new ProductImage(
      this.props.url,
      this.props.alt,
      order,
      this.props.isPrimary
    );
  }

  public setPrimary(isPrimary: boolean): ProductImage {
    return new ProductImage(
      this.props.url,
      this.props.alt,
      this.props.order,
      isPrimary
    );
  }

  public updateAlt(alt: string): ProductImage {
    if (!alt || typeof alt !== 'string') {
      throw new Error('图片描述不能为空');
    }

    return new ProductImage(
      this.props.url,
      alt,
      this.props.order,
      this.props.isPrimary
    );
  }

  public equals(other: ProductImage): boolean {
    if (!other) return false;
    return this.props.url === other.props.url &&
           this.props.alt === other.props.alt &&
           this.props.order === other.props.order &&
           this.props.isPrimary === other.props.isPrimary;
  }

  public toJSON() {
    return {
      url: this.props.url,
      alt: this.props.alt,
      order: this.props.order,
      isPrimary: this.props.isPrimary
    };
  }
} 