import { injectable, inject } from 'inversify';
import { UserRepository } from '../repositories/UserRepository';
import { Email } from '../value-objects/Email';
import { UserId } from '../value-objects/UserId';
import { TYPES } from '../../../../config/container';

/**
 * 用户唯一性验证领域服务
 * 处理用户相关的唯一性验证业务逻辑
 */
@injectable()
export class UserUniquenessService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository
  ) {}

  /**
   * 检查邮箱地址是否唯一
   * @param email 要检查的邮箱地址
   * @param excludeUserId 要排除的用户ID（用于更新场景）
   * @returns true表示邮箱唯一，false表示已存在
   */
  async isEmailUnique(email: Email, excludeUserId?: UserId): Promise<boolean> {
    const existingUser = await this.userRepository.findByEmail(email);
    
    if (!existingUser) {
      return true;
    }

    // 如果指定了要排除的用户ID，检查是否是同一个用户
    if (excludeUserId && existingUser.getId().equals(excludeUserId)) {
      return true;
    }

    return false;
  }

  /**
   * 检查用户名是否唯一
   * @param username 要检查的用户名
   * @param excludeUserId 要排除的用户ID（用于更新场景）
   * @returns true表示用户名唯一，false表示已存在
   */
  async isUsernameUnique(username: string, excludeUserId?: UserId): Promise<boolean> {
    if (!username || username.trim().length === 0) {
      throw new Error('用户名不能为空');
    }

    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await this.userRepository.findByUsername(normalizedUsername);
    
    if (!existingUser) {
      return true;
    }

    // 如果指定了要排除的用户ID，检查是否是同一个用户
    if (excludeUserId && existingUser.getId().equals(excludeUserId)) {
      return true;
    }

    return false;
  }

  /**
   * 检查手机号是否唯一
   * @param phoneNumber 要检查的手机号
   * @param excludeUserId 要排除的用户ID（用于更新场景）
   * @returns true表示手机号唯一，false表示已存在
   */
  async isPhoneNumberUnique(phoneNumber: string, excludeUserId?: UserId): Promise<boolean> {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new Error('手机号不能为空');
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('手机号格式无效');
    }

    const existingUser = await this.userRepository.findByPhoneNumber(phoneNumber);
    
    if (!existingUser) {
      return true;
    }

    // 如果指定了要排除的用户ID，检查是否是同一个用户
    if (excludeUserId && existingUser.getId().equals(excludeUserId)) {
      return true;
    }

    return false;
  }

  /**
   * 批量检查用户信息的唯一性
   * @param userInfo 用户信息
   * @param excludeUserId 要排除的用户ID
   * @returns 验证结果
   */
  async validateUserUniqueness(
    userInfo: {
      email?: Email;
      username?: string;
      phoneNumber?: string;
    },
    excludeUserId?: UserId
  ): Promise<{
    isValid: boolean;
    conflicts: Array<{
      field: 'email' | 'username' | 'phoneNumber';
      value: string;
      message: string;
    }>;
  }> {
    const conflicts: Array<{
      field: 'email' | 'username' | 'phoneNumber';
      value: string;
      message: string;
    }> = [];

    // 检查邮箱唯一性
    if (userInfo.email) {
      const emailUnique = await this.isEmailUnique(userInfo.email, excludeUserId);
      if (!emailUnique) {
        conflicts.push({
          field: 'email',
          value: userInfo.email.value,
          message: '该邮箱地址已被注册'
        });
      }
    }

    // 检查用户名唯一性
    if (userInfo.username) {
      const usernameUnique = await this.isUsernameUnique(userInfo.username, excludeUserId);
      if (!usernameUnique) {
        conflicts.push({
          field: 'username',
          value: userInfo.username,
          message: '该用户名已被使用'
        });
      }
    }

    // 检查手机号唯一性
    if (userInfo.phoneNumber) {
      const phoneUnique = await this.isPhoneNumberUnique(userInfo.phoneNumber, excludeUserId);
      if (!phoneUnique) {
        conflicts.push({
          field: 'phoneNumber',
          value: userInfo.phoneNumber,
          message: '该手机号已被注册'
        });
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * 生成唯一的用户名建议
   * 当用户名冲突时，生成可用的替代建议
   */
  async generateUniqueUsernameSuggestions(baseUsername: string, count: number = 3): Promise<string[]> {
    if (!baseUsername || baseUsername.trim().length === 0) {
      throw new Error('基础用户名不能为空');
    }

    const normalizedBase = baseUsername.trim().toLowerCase();
    const suggestions: string[] = [];
    
    // 尝试在原用户名后加数字
    for (let i = 1; suggestions.length < count && i <= 100; i++) {
      const candidate = `${normalizedBase}${i}`;
      const isUnique = await this.isUsernameUnique(candidate);
      if (isUnique) {
        suggestions.push(candidate);
      }
    }

    // 如果数字后缀不够，尝试随机后缀
    while (suggestions.length < count) {
      const randomSuffix = Math.floor(Math.random() * 10000);
      const candidate = `${normalizedBase}_${randomSuffix}`;
      const isUnique = await this.isUsernameUnique(candidate);
      if (isUnique && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
    }

    return suggestions;
  }

  /**
   * 检查是否存在相似的邮箱地址
   * 用于防止用户误输入或恶意注册
   */
  async findSimilarEmails(email: Email, threshold: number = 2): Promise<Email[]> {
    // 获取所有用户邮箱（在实际项目中应该有更高效的实现）
    const allUsers = await this.userRepository.findAll();
    const similarEmails: Email[] = [];
    
    const targetEmail = email.value.toLowerCase();
    
    for (const user of allUsers) {
      const userEmail = user.getEmail().value.toLowerCase();
      const distance = this.calculateLevenshteinDistance(targetEmail, userEmail);
      
      if (distance <= threshold && distance > 0) {
        similarEmails.push(user.getEmail());
      }
    }

    return similarEmails;
  }

  /**
   * 验证邮箱域名是否在允许列表中
   */
  isEmailDomainAllowed(email: Email): boolean {
    // 定义允许的邮箱域名列表
    const allowedDomains = [
      'gmail.com',
      'qq.com',
      '163.com',
      '126.com',
      'sina.com',
      'outlook.com',
      'hotmail.com',
      'yahoo.com'
    ];

    const domain = email.value.split('@')[1]?.toLowerCase();
    return allowedDomains.includes(domain);
  }

  /**
   * 验证邮箱域名是否在黑名单中
   */
  isEmailDomainBlocked(email: Email): boolean {
    // 定义被阻止的邮箱域名列表（临时邮箱等）
    const blockedDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com'
    ];

    const domain = email.value.split('@')[1]?.toLowerCase();
    return blockedDomains.includes(domain);
  }

  /**
   * 计算两个字符串的编辑距离（Levenshtein距离）
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
} 