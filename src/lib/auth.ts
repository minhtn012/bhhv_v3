import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/jwt';

export interface AuthUser extends JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function requireAuth(request: NextRequest): AuthUser {
  const user = getAuthUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export function requireAdmin(request: NextRequest): AuthUser {
  const user = requireAuth(request);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}