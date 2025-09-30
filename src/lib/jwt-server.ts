/**
 * Server-only JWT functions that use Node.js crypto module
 * These functions CANNOT be used in middleware (Edge Runtime)
 * Use only in API routes
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWTPayload } from './jwt';

const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-change-in-production';

/**
 * Generate long-lived refresh token (7 days)
 * Returns both the JWT and a random token ID for database storage
 *
 * NOTE: Uses Node.js crypto - only use in API routes, not middleware
 */
export function signRefreshToken(payload: JWTPayload): { token: string; tokenId: string } {
  const tokenId = crypto.randomBytes(32).toString('hex');

  const token = jwt.sign(
    { ...payload, tokenId },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { token, tokenId };
}