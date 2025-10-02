import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Verify JWT token - Edge Runtime compatible
 * Uses jose library which works in Edge Runtime
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Validate payload structure
    if (
      typeof payload.userId === 'string' &&
      typeof payload.username === 'string' &&
      typeof payload.email === 'string' &&
      (payload.role === 'admin' || payload.role === 'user')
    ) {
      return {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role
      };
    }

    return null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
