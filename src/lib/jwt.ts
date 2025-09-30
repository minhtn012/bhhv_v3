import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Generate short-lived access token (30 minutes)
 * Edge Runtime compatible
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' });
}

/**
 * Verify access token
 * Edge Runtime compatible
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 * Edge Runtime compatible
 */
export function verifyRefreshToken(token: string): (JWTPayload & { tokenId: string }) | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload & { tokenId: string };
  } catch (error) {
    return null;
  }
}