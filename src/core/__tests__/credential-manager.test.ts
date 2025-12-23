/**
 * Credential Manager Unit Tests
 */

import { CredentialManager, encryptValue, decryptValue } from '../credentials/credential-manager';

describe('CredentialManager', () => {
  let manager: CredentialManager;

  beforeEach(() => {
    manager = new CredentialManager();
  });

  describe('encryptValue and decryptValue', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const original = 'test-password-123';
      const encrypted = encryptValue(original);

      expect(encrypted).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext).not.toBe(original);

      const decrypted = decryptValue(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same input (unique IV)', () => {
      const original = 'same-password';
      const encrypted1 = encryptValue(original);
      const encrypted2 = encryptValue(original);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);

      // Both should decrypt to the same value
      expect(decryptValue(encrypted1)).toBe(original);
      expect(decryptValue(encrypted2)).toBe(original);
    });

    it('should handle special characters', () => {
      const original = 'p@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptValue(original);
      const decrypted = decryptValue(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle unicode characters', () => {
      const original = 'mật khẩu Việt Nam 中文密码';
      const encrypted = encryptValue(original);
      const decrypted = decryptValue(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle empty string', () => {
      const original = '';
      const encrypted = encryptValue(original);
      const decrypted = decryptValue(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle long strings', () => {
      const original = 'a'.repeat(10000);
      const encrypted = encryptValue(original);
      const decrypted = decryptValue(encrypted);

      expect(decrypted).toBe(original);
    });
  });

  describe('encrypt and decrypt credentials', () => {
    it('should encrypt and decrypt credentials object', () => {
      const credentials = {
        username: 'test_user@example.com',
        password: 'secure_password_123!',
      };

      const encrypted = manager.encrypt(credentials);

      expect(encrypted.username).toBeDefined();
      expect(encrypted.password).toBeDefined();
      expect(encrypted.username.algorithm).toBe('aes-256-gcm');
      expect(encrypted.password.algorithm).toBe('aes-256-gcm');

      const decrypted = manager.decrypt(encrypted);
      expect(decrypted.username).toBe(credentials.username);
      expect(decrypted.password).toBe(credentials.password);
    });
  });

  describe('validateKeyAvailable', () => {
    it('should return true when encryption key is available', () => {
      const result = manager.validateKeyAvailable();
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid encrypted data format', () => {
      const invalidEncrypted = {
        algorithm: 'aes-256-gcm' as const,
        iv: 'invalid-base64',
        authTag: 'invalid-base64',
        ciphertext: 'invalid-ciphertext',
      };

      expect(() => decryptValue(invalidEncrypted)).toThrow();
    });

    it('should throw on tampered ciphertext', () => {
      const original = 'test-password';
      const encrypted = encryptValue(original);

      // Tamper with ciphertext by replacing with completely different value
      const tamperedEncrypted = {
        ...encrypted,
        ciphertext: Buffer.from('completely-different-data').toString('base64'),
      };

      expect(() => decryptValue(tamperedEncrypted)).toThrow();
    });

    it('should throw on tampered authTag', () => {
      const original = 'test-password';
      const encrypted = encryptValue(original);

      // Tamper with authTag
      const tamperedEncrypted = {
        ...encrypted,
        authTag: Buffer.from('tampered-tag').toString('base64'),
      };

      expect(() => decryptValue(tamperedEncrypted)).toThrow();
    });
  });
});
