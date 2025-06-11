import { ValueObject } from '../../../../shared/domain/ValueObject';

interface InventoryProps {
  quantity: number;
  reservedQuantity: number;
  minStockLevel: number;
}

export class Inventory extends ValueObject<InventoryProps> {
  constructor(quantity: number, reservedQuantity: number = 0, minStockLevel: number = 0) {
    super({ quantity, reservedQuantity, minStockLevel });
    this.validate();
  }

  private validate(): void {
    if (this.props.quantity < 0) {
      throw new Error('库存数量不能为负数');
    }

    if (this.props.reservedQuantity < 0) {
      throw new Error('预留库存不能为负数');
    }

    if (this.props.minStockLevel < 0) {
      throw new Error('最小库存级别不能为负数');
    }

    if (this.props.reservedQuantity > this.props.quantity) {
      throw new Error('预留库存不能超过总库存');
    }
  }

  public getQuantity(): number {
    return this.props.quantity;
  }

  public getReservedQuantity(): number {
    return this.props.reservedQuantity;
  }

  public getAvailableQuantity(): number {
    return this.props.quantity - this.props.reservedQuantity;
  }

  public getMinStockLevel(): number {
    return this.props.minStockLevel;
  }

  public isInStock(): boolean {
    return this.getAvailableQuantity() > 0;
  }

  public isLowStock(): boolean {
    return this.props.quantity <= this.props.minStockLevel;
  }

  public canReserve(quantity: number): boolean {
    return this.getAvailableQuantity() >= quantity;
  }

  public reserve(quantity: number): Inventory {
    if (quantity <= 0) {
      throw new Error('预留数量必须大于0');
    }

    if (!this.canReserve(quantity)) {
      throw new Error('库存不足，无法预留');
    }

    return new Inventory(
      this.props.quantity,
      this.props.reservedQuantity + quantity,
      this.props.minStockLevel
    );
  }

  public releaseReservation(quantity: number): Inventory {
    if (quantity <= 0) {
      throw new Error('释放数量必须大于0');
    }

    if (quantity > this.props.reservedQuantity) {
      throw new Error('释放数量不能超过预留数量');
    }

    return new Inventory(
      this.props.quantity,
      this.props.reservedQuantity - quantity,
      this.props.minStockLevel
    );
  }

  public deduct(quantity: number): Inventory {
    if (quantity <= 0) {
      throw new Error('扣减数量必须大于0');
    }

    if (quantity > this.props.reservedQuantity) {
      throw new Error('扣减数量不能超过预留数量');
    }

    return new Inventory(
      this.props.quantity - quantity,
      this.props.reservedQuantity - quantity,
      this.props.minStockLevel
    );
  }

  public addStock(quantity: number): Inventory {
    if (quantity <= 0) {
      throw new Error('增加库存数量必须大于0');
    }

    return new Inventory(
      this.props.quantity + quantity,
      this.props.reservedQuantity,
      this.props.minStockLevel
    );
  }

  public updateMinStockLevel(minStockLevel: number): Inventory {
    if (minStockLevel < 0) {
      throw new Error('最小库存级别不能为负数');
    }

    return new Inventory(
      this.props.quantity,
      this.props.reservedQuantity,
      minStockLevel
    );
  }

  public equals(other: Inventory): boolean {
    if (!other) return false;
    return this.props.quantity === other.props.quantity &&
           this.props.reservedQuantity === other.props.reservedQuantity &&
           this.props.minStockLevel === other.props.minStockLevel;
  }

  public static zero(): Inventory {
    return new Inventory(0, 0, 0);
  }

  public toJSON() {
    return {
      quantity: this.props.quantity,
      reserved: this.props.reservedQuantity,
      available: this.getAvailableQuantity(),
      minStockLevel: this.props.minStockLevel,
      inStock: this.isInStock(),
      lowStock: this.isLowStock()
    };
  }
} 