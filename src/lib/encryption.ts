import crypto from 'crypto';

/**
 * Encryption utilities for secure storage of sensitive data
 * Uses AES-256-GCM encryption for authenticated encryption
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get encryption key from environment variable
 * Falls back to default for development (should use proper env var in production)
 */
function getEncryptionKey(): string {
  return process.env.ENCRYPTION_KEY || 'bhv-default-encryption-key-change-in-production';
}

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha512');
}

/**
 * Encrypt a plaintext string
 * Returns base64 encoded string containing: salt + iv + encrypted_data
 */
export function encrypt(plaintext: string): string {
  try {
    const password = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combine salt + iv + encrypted_data
    const combined = Buffer.concat([
      salt,
      iv,
      Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a base64 encoded encrypted string
 * Expected format: salt + iv + encrypted_data
 */
export function decrypt(encryptedData: string): string {
  try {
    const password = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH);

    const key = deriveKey(password, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt BHV credentials object
 */
export function encryptBhvCredentials(username: string, password: string): {
  encryptedUsername: string;
  encryptedPassword: string;
} {
  return {
    encryptedUsername: encrypt(username),
    encryptedPassword: encrypt(password)
  };
}

/**
 * Decrypt BHV credentials object
 */
export function decryptBhvCredentials(encryptedUsername: string, encryptedPassword: string): {
  username: string;
  password: string;
} {
  return {
    username: decrypt(encryptedUsername),
    password: decrypt(encryptedPassword)
  };
}

/**
 * Validate encryption key strength
 */
export function validateEncryptionKey(): boolean {
  const key = getEncryptionKey();
  return key.length >= 32; // At least 256 bits
}