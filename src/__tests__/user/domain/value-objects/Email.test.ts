import { Email } from '@contexts/user/domain/value-objects/Email';

describe('Email Value Object', () => {
  describe('Constructor', () => {
    it('应该创建有效的邮箱地址', () => {
      const validEmail = 'test@example.com';
      const email = new Email(validEmail);
      
      expect(email.value).toBe(validEmail);
    });

    it('应该拒绝空邮箱地址', () => {
      expect(() => new Email('')).toThrow('邮箱地址不能为空');
    });

    it('应该拒绝格式不正确的邮箱地址', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test@.com',
        'test@com',
      ];

      invalidEmails.forEach(invalidEmail => {
        expect(() => new Email(invalidEmail)).toThrow('邮箱地址格式不正确');
      });
    });

    it('应该拒绝过长的邮箱地址', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => new Email(longEmail)).toThrow('邮箱地址长度不能超过254个字符');
    });
  });

  describe('Equality', () => {
    it('相同邮箱地址的Email对象应该相等', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      
      expect(email1.equals(email2)).toBe(true);
    });

    it('不同邮箱地址的Email对象应该不相等', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');
      
      expect(email1.equals(email2)).toBe(false);
    });

    it('与null比较应该返回false', () => {
      const email = new Email('test@example.com');
      
      expect(email.equals(null)).toBe(false);
      expect(email.equals(undefined)).toBe(false);
    });
  });

  describe('toString', () => {
    it('应该返回邮箱地址字符串', () => {
      const emailValue = 'test@example.com';
      const email = new Email(emailValue);
      
      expect(email.toString()).toBe(emailValue);
    });
  });
}); 