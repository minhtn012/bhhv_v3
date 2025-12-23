/**
 * Credential Manager - Secure encryption/decryption for provider credentials
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';
import type { ProviderCredentials } from '../providers/types';

export interface EncryptedCredential {
  algorithm: 'aes-256-gcm';
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface StoredProviderCredentials {
  providerId: string;
  username: EncryptedCredential;
  password: EncryptedCredential;
  createdAt: Date;
  updatedAt: Date;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!keyHex) {
    // Fallback for development - should use proper key in production
    const fallbackKey = process.env.ENCRYPTION_KEY || 'bhv-default-encryption-key-change-in-production';
    return crypto.scryptSync(fallbackKey, 'salt', 32);
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a string value using AES-256-GCM
 */
export function encryptValue(plaintext: string): EncryptedCredential {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  return {
    algorithm: 'aes-256-gcm',
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext,
  };
}

/**
 * Decrypt an encrypted value
 */
export function decryptValue(encrypted: EncryptedCredential): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encrypted.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));

  let plaintext = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

/**
 * Credential Manager class for provider-specific credential handling
 */
export class CredentialManager {
  /**
   * Encrypt provider credentials
   */
  encrypt(credentials: ProviderCredentials): {
    username: EncryptedCredential;
    password: EncryptedCredential;
  } {
    return {
      username: encryptValue(credentials.username),
      password: encryptValue(credentials.password),
    };
  }

  /**
   * Decrypt provider credentials
   */
  decrypt(encrypted: {
    username: EncryptedCredential;
    password: EncryptedCredential;
  }): ProviderCredentials {
    return {
      username: decryptValue(encrypted.username),
      password: decryptValue(encrypted.password),
    };
  }

  /**
   * Validate that decryption key is available
   */
  validateKeyAvailable(): boolean {
    try {
      const key = getEncryptionKey();
      return key.length === 32;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const credentialManager = new CredentialManager();
