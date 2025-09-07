import { signToken, verifyToken, JWTPayload } from '../jwt';

describe('JWT Utilities', () => {
  const validPayload: JWTPayload = {
    userId: '6507f1f77bcf86cd799439b1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
  };

  const adminPayload: JWTPayload = {
    userId: '6507f1f77bcf86cd799439b0',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
  };

  describe('signToken', () => {
    test('should create a valid JWT token', () => {
      const token = signToken(validPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      expect(token.length).toBeGreaterThan(50); // Should be a reasonable length
    });

    test('should create different tokens for different payloads', () => {
      const token1 = signToken(validPayload);
      const token2 = signToken(adminPayload);
      
      expect(token1).not.toBe(token2);
    });

    test('should create different tokens each time (due to iat)', (done) => {
      const token1 = signToken(validPayload);
      
      // Wait a second to ensure different iat
      setTimeout(() => {
        const token2 = signToken(validPayload);
        expect(token1).not.toBe(token2);
        done();
      }, 1100);
    }, 2000);

    test('should handle all user roles', () => {
      const userToken = signToken({ ...validPayload, role: 'user' });
      const adminToken = signToken({ ...validPayload, role: 'admin' });
      
      expect(typeof userToken).toBe('string');
      expect(typeof adminToken).toBe('string');
      expect(userToken).not.toBe(adminToken);
    });
  });

  describe('verifyToken', () => {
    test('should verify and decode a valid token', () => {
      const token = signToken(validPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toMatchObject({
        userId: validPayload.userId,
        username: validPayload.username,
        email: validPayload.email,
        role: validPayload.role,
      });
      
      // Should also include JWT standard claims
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.string';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    test('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = verifyToken(malformedToken);
      
      expect(decoded).toBeNull();
    });

    test('should return null for empty token', () => {
      const decoded = verifyToken('');
      
      expect(decoded).toBeNull();
    });

    test('should return null for token with wrong signature', () => {
      // This test might not work as expected due to environment variables being cached
      // Instead, test with a clearly invalid token
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const decoded = verifyToken(invalidToken);
      expect(decoded).toBeNull();
    });

    test('should verify admin tokens correctly', () => {
      const token = signToken(adminPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toMatchObject({
        userId: adminPayload.userId,
        username: adminPayload.username,
        email: adminPayload.email,
        role: 'admin',
      });
    });
  });

  describe('Token Lifecycle', () => {
    test('should create and verify token in complete cycle', () => {
      // Sign token
      const token = signToken(validPayload);
      expect(token).toBeDefined();
      
      // Verify token
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(validPayload.userId);
      expect(decoded!.email).toBe(validPayload.email);
      expect(decoded!.role).toBe(validPayload.role);
    });

    test('should maintain data integrity through sign/verify cycle', () => {
      const complexPayload: JWTPayload = {
        userId: '507f1f77bcf86cd799439011',
        username: 'complex-user-123',
        email: 'complex.email+test@subdomain.example.com',
        role: 'admin',
      };
      
      const token = signToken(complexPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toMatchObject(complexPayload);
    });
  });

  describe('Error Handling', () => {
    test('should handle tokens with tampered payload', () => {
      // Use a known invalid token with wrong signature for consistent testing
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTA3ZjFmNzdiY2Y4NmNkNzk5NDM5YjEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIifQ.tampered_signature_here';
      
      const decoded = verifyToken(tamperedToken);
      expect(decoded).toBeNull();
    });

    test('should handle very long strings as tokens', () => {
      const longString = 'a'.repeat(10000);
      const decoded = verifyToken(longString);
      
      expect(decoded).toBeNull();
    });

    test('should handle special characters in token', () => {
      const specialToken = 'special!@#$%^&*()characters';
      const decoded = verifyToken(specialToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    test('should include expiration in token', () => {
      const token = signToken(validPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toHaveProperty('exp');
      expect(typeof decoded!.exp).toBe('number');
      
      // Should expire in 7 days (7 * 24 * 60 * 60 seconds)
      const expectedExpiration = decoded!.iat! + (7 * 24 * 60 * 60);
      expect(decoded!.exp).toBe(expectedExpiration);
    });
  });

  describe('Payload Validation', () => {
    test('should preserve exact payload structure', () => {
      const token = signToken(validPayload);
      const decoded = verifyToken(token);
      
      // Should have exact same keys (plus JWT standard claims)
      expect(Object.keys(decoded!)).toContain('userId');
      expect(Object.keys(decoded!)).toContain('username');
      expect(Object.keys(decoded!)).toContain('email');
      expect(Object.keys(decoded!)).toContain('role');
      expect(Object.keys(decoded!)).toContain('iat');
      expect(Object.keys(decoded!)).toContain('exp');
    });

    test('should handle empty string values in payload', () => {
      const emptyPayload: JWTPayload = {
        userId: '',
        username: '',
        email: '',
        role: 'user',
      };
      
      const token = signToken(emptyPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toMatchObject(emptyPayload);
    });
  });
});