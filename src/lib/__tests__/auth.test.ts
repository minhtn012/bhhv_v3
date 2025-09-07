import { NextRequest } from 'next/server';
import { getAuthUser, requireAuth, requireAdmin, AuthUser } from '../auth';
import { signToken } from '../jwt';
import { mockUsers } from '../../__tests__/test-helpers/fixtures';

// Mock NextRequest for testing
const createMockNextRequest = (url: string, options: { headers?: Record<string, string> } = {}) => {
  const headers = new Map();
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  return {
    url,
    headers,
    cookies: {
      get: (name: string) => {
        const cookieHeader = headers.get('cookie');
        if (!cookieHeader) return undefined;
        
        const cookies = cookieHeader.split(';').map(c => c.trim().split('='));
        const cookie = cookies.find(([key]) => key === name);
        return cookie ? { value: cookie[1] } : undefined;
      }
    }
  } as NextRequest;
};

// Mock the JWT module
jest.mock('../jwt', () => ({
  verifyToken: jest.fn(),
}));

const mockVerifyToken = require('../jwt').verifyToken as jest.MockedFunction<typeof import('../jwt').verifyToken>;

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthUser', () => {
    test('should return user when valid token in cookies', () => {
      // Setup mock
      mockVerifyToken.mockReturnValue(mockUsers.user);
      
      // Create request with cookie
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=valid-jwt-token',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toEqual(mockUsers.user);
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-jwt-token');
    });

    test('should return null when no token in cookies', () => {
      const request = createMockNextRequest('http://localhost:3000/test');

      const result = getAuthUser(request);
      
      expect(result).toBeNull();
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    test('should return null when token verification fails', () => {
      // Setup mock to return null (invalid token)
      mockVerifyToken.mockReturnValue(null);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=invalid-jwt-token',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toBeNull();
      expect(mockVerifyToken).toHaveBeenCalledWith('invalid-jwt-token');
    });

    test('should return null when cookie has no token value', () => {
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'other=value; session=123',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toBeNull();
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    test('should handle malformed cookies gracefully', () => {
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'malformed-cookie-string',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toBeNull();
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    test('should return admin user when admin token is provided', () => {
      // Setup mock
      mockVerifyToken.mockReturnValue(mockUsers.admin);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=admin-jwt-token',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toEqual(mockUsers.admin);
      expect(result!.role).toBe('admin');
      expect(mockVerifyToken).toHaveBeenCalledWith('admin-jwt-token');
    });

    test('should handle multiple cookies and extract token correctly', () => {
      mockVerifyToken.mockReturnValue(mockUsers.user);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'session=abc123; token=user-jwt-token; other=value',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toEqual(mockUsers.user);
      expect(mockVerifyToken).toHaveBeenCalledWith('user-jwt-token');
    });

    test('should handle error during token verification', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Setup mock to throw error
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Token verification error');
      });
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=problematic-token',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Auth error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('requireAuth', () => {
    test('should return user when authentication succeeds', () => {
      mockVerifyToken.mockReturnValue(mockUsers.user);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=valid-jwt-token',
        },
      });

      const result = requireAuth(request);
      
      expect(result).toEqual(mockUsers.user);
    });

    test('should throw error when no authentication', () => {
      const request = createMockNextRequest('http://localhost:3000/test');

      expect(() => requireAuth(request)).toThrow('Authentication required');
    });

    test('should throw error when token is invalid', () => {
      mockVerifyToken.mockReturnValue(null);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=invalid-token',
        },
      });

      expect(() => requireAuth(request)).toThrow('Authentication required');
    });

    test('should return admin user when admin is authenticated', () => {
      mockVerifyToken.mockReturnValue(mockUsers.admin);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=admin-token',
        },
      });

      const result = requireAuth(request);
      
      expect(result).toEqual(mockUsers.admin);
      expect(result.role).toBe('admin');
    });
  });

  describe('requireAdmin', () => {
    test('should return admin user when admin is authenticated', () => {
      mockVerifyToken.mockReturnValue(mockUsers.admin);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=admin-token',
        },
      });

      const result = requireAdmin(request);
      
      expect(result).toEqual(mockUsers.admin);
      expect(result.role).toBe('admin');
    });

    test('should throw error when no authentication', () => {
      const request = createMockNextRequest('http://localhost:3000/test');

      expect(() => requireAdmin(request)).toThrow('Authentication required');
    });

    test('should throw error when user is not admin', () => {
      mockVerifyToken.mockReturnValue(mockUsers.user);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=user-token',
        },
      });

      expect(() => requireAdmin(request)).toThrow('Admin access required');
    });

    test('should throw error when token is invalid', () => {
      mockVerifyToken.mockReturnValue(null);
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=invalid-token',
        },
      });

      expect(() => requireAdmin(request)).toThrow('Authentication required');
    });
  });

  describe('Integration Tests', () => {
    test('should work with valid JWT payload from verifyToken', () => {
      // This tests the integration between getAuthUser and JWT verification
      // without needing complex module re-mocking
      mockVerifyToken.mockReturnValue({
        ...mockUsers.admin,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      });
      
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=valid-jwt-token',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toMatchObject({
        userId: mockUsers.admin.userId,
        username: mockUsers.admin.username,
        email: mockUsers.admin.email,
        role: mockUsers.admin.role,
      });
    });

    test('should handle complete admin workflow with mocked JWT', () => {
      mockVerifyToken.mockReturnValue(mockUsers.admin);
      
      const request = createMockNextRequest('http://localhost:3000/admin', {
        headers: {
          cookie: 'token=admin-jwt-token',
        },
      });

      // Should pass all auth checks
      expect(() => {
        const user = requireAuth(request);
        expect(user.role).toBe('admin');
        
        const admin = requireAdmin(request);
        expect(admin.role).toBe('admin');
      }).not.toThrow();
    });

    test('should handle complete user workflow (should fail admin check)', () => {
      mockVerifyToken.mockReturnValue(mockUsers.user);
      
      const request = createMockNextRequest('http://localhost:3000/user', {
        headers: {
          cookie: 'token=user-jwt-token',
        },
      });

      // Should pass auth but fail admin check
      expect(() => requireAuth(request)).not.toThrow();
      expect(() => requireAdmin(request)).toThrow('Admin access required');
    });
  });

  describe('Edge Cases', () => {
    test('should handle request without headers', () => {
      const request = createMockNextRequest('http://localhost:3000/test');
      
      const result = getAuthUser(request);
      
      expect(result).toBeNull();
    });

    test('should handle empty cookie string', () => {
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: '',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toBeNull();
    });

    test('should handle cookie with empty token value', () => {
      const request = createMockNextRequest('http://localhost:3000/test', {
        headers: {
          cookie: 'token=',
        },
      });

      const result = getAuthUser(request);
      
      expect(result).toBeNull();
    });
  });
});