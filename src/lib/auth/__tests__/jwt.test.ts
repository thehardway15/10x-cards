import { describe, it, expect, beforeEach } from 'vitest';
import { createToken, verifyToken, extractTokenFromHeader } from '../jwt';
import type { User } from '@supabase/supabase-js';

describe('JWT Module', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
    updated_at: '',
  };

  describe('createToken', () => {
    it('should create a valid JWT token', async () => {
      const token = await createToken(mockUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header, payload, signature
    });

    it('should include user data in token payload', async () => {
      const token = await createToken(mockUser);
      const [, payloadBase64] = token.split('.');
      const payload = JSON.parse(atob(payloadBase64));

      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    let validToken: string;

    beforeEach(async () => {
      validToken = await createToken(mockUser);
    });

    it('should verify a valid token', async () => {
      const payload = await verifyToken(validToken);
      expect(payload.sub).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should reject an invalid token', async () => {
      const invalidToken = 'invalid.token.here';
      await expect(verifyToken(invalidToken)).rejects.toThrow('Invalid token');
    });

    it('should reject an expired token', async () => {
      // Override JWT_SECRET to create an expired token
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret';

      // Create token that's already expired
      const expiredToken = await createToken(mockUser);

      // Restore original secret
      process.env.JWT_SECRET = originalSecret;

      await expect(verifyToken(expiredToken)).rejects.toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const token = 'valid.token.here';
      const header = `Bearer ${token}`;
      expect(extractTokenFromHeader(header)).toBe(token);
    });

    it('should throw error for missing Bearer prefix', () => {
      const header = 'valid.token.here';
      expect(() => extractTokenFromHeader(header)).toThrow('Invalid authorization header');
    });

    it('should throw error for undefined header', () => {
      expect(() => extractTokenFromHeader(undefined)).toThrow('Invalid authorization header');
    });
  });
});