import { addFamilyMemberSchema } from '@modules/family/validators/add-family-member.validator';
import { FamilyRole } from '@modules/family/domain/family';

describe('addFamilyMemberSchema', () => {
  describe('email validation', () => {
    it('should accept valid email and normalize to lowercase', () => {
      const result = addFamilyMemberSchema.parse({
        email: 'Test.User@Example.COM',
        password: 'password123',
        role: FamilyRole.Child,
      });

      expect(result.email).toBe('test.user@example.com');
    });

    it('should trim whitespace from email', () => {
      const result = addFamilyMemberSchema.parse({
        email: '  user@example.com  ',
        password: 'password123',
        role: FamilyRole.Child,
      });

      expect(result.email).toBe('user@example.com');
    });

    it('should reject invalid email format', () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: 'not-an-email',
          password: 'password123',
          role: FamilyRole.Child,
        })
      ).toThrow('Invalid email format');
    });

    it('should reject empty email', () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: '',
          password: 'password123',
          role: FamilyRole.Child,
        })
      ).toThrow();
    });

    it('should reject missing email', () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          password: 'password123',
          role: FamilyRole.Child,
        })
      ).toThrow();
    });

    it('should reject email exceeding 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() =>
        addFamilyMemberSchema.parse({
          email: longEmail,
          password: 'password123',
          role: FamilyRole.Child,
        })
      ).toThrow('Email cannot exceed 255 characters');
    });
  });

  describe('password validation', () => {
    it('should accept password with minimum 8 characters', () => {
      const result = addFamilyMemberSchema.parse({
        email: 'user@example.com',
        password: 'password',
        role: FamilyRole.Child,
      });

      expect(result.password).toBe('password');
    });

    it('should reject password shorter than 8 characters', () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: 'user@example.com',
          password: 'pass123',
          role: FamilyRole.Child,
        })
      ).toThrow('Password must be at least 8 characters');
    });

    it('should reject missing password', () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: 'user@example.com',
          role: FamilyRole.Child,
        })
      ).toThrow();
    });
  });

  describe('role validation', () => {
    it('should accept Parent role', () => {
      const result = addFamilyMemberSchema.parse({
        email: 'user@example.com',
        password: 'password123',
        role: FamilyRole.Parent,
      });

      expect(result.role).toBe(FamilyRole.Parent);
    });

    it('should accept Child role', () => {
      const result = addFamilyMemberSchema.parse({
        email: 'user@example.com',
        password: 'password123',
        role: FamilyRole.Child,
      });

      expect(result.role).toBe(FamilyRole.Child);
    });

    it('should reject invalid role', () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: 'user@example.com',
          password: 'password123',
          role: 'InvalidRole',
        })
      ).toThrow();
    });

    it('should reject missing role', () => {
      expect(() =>
        addFamilyMemberSchema.parse({
          email: 'user@example.com',
          password: 'password123',
        })
      ).toThrow();
    });
  });

  describe('complete payload validation', () => {
    it('should accept valid payload with all required fields', () => {
      const result = addFamilyMemberSchema.parse({
        email: 'child@example.com',
        password: 'securepass123',
        role: FamilyRole.Child,
      });

      expect(result).toEqual({
        email: 'child@example.com',
        password: 'securepass123',
        role: FamilyRole.Child,
      });
    });

    it('should reject payload with extra fields', () => {
      const result = addFamilyMemberSchema.parse({
        email: 'child@example.com',
        password: 'securepass123',
        role: FamilyRole.Child,
        extraField: 'should be stripped',
      });

      expect(result).not.toHaveProperty('extraField');
    });
  });
});
