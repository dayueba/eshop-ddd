/**
 * ID生成器接口
 * 用于在领域层生成唯一标识符，确保实体在持久化前就有ID
 */
export interface IdGenerator<T = string> {
  /**
   * 生成下一个唯一ID
   * @returns 新生成的唯一ID
   */
  nextId(): T;
  
  /**
   * 验证ID是否有效
   * @param id 要验证的ID
   * @returns 是否为有效ID
   */
  isValid(id: T): boolean;
} 