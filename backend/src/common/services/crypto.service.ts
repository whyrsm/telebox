import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * CryptoService handles per-user metadata encryption.
 * 
 * Each user's metadata (filenames, folder names) is encrypted with a key
 * derived from their unique session string. This ensures that even with
 * full database access, developers cannot read user metadata.
 */
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || '';
    if (!this.encryptionKey) {
      console.warn('⚠️ ENCRYPTION_KEY not set! Session encryption will fail.');
    }
  }

  /**
   * Derives a 32-byte encryption key from the user's raw (decrypted) session string.
   * This ensures the key is stable even if the database encryption format changes.
   */
  deriveKeyFromSession(rawSessionString: string): Buffer {
    // Use SHA-256 to derive a consistent 32-byte key from the raw session
    return createHash('sha256').update(rawSessionString).digest();
  }

  /**
   * Encrypts metadata (filename, folder name) using the user's derived key.
   * Returns format: iv:authTag:encryptedData (all hex encoded)
   */
  encryptMetadata(plaintext: string, userKey: Buffer): string {
    const iv = randomBytes(12); // GCM recommends 12 bytes
    const cipher = createCipheriv(this.algorithm, userKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts metadata using the user's derived key.
   */
  decryptMetadata(encryptedData: string, userKey: Buffer): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      // Return as-is if not in encrypted format (for backward compatibility)
      return encryptedData;
    }

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = createDecipheriv(this.algorithm, userKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      // Return as-is if decryption fails (backward compatibility for unencrypted data)
      return encryptedData;
    }
  }

  /**
   * Encrypts a session string using the master ENCRYPTION_KEY.
   * Uses AES-256-GCM for authenticated encryption.
   * Format: iv:authTag:encrypted
   */
  encryptSession(sessionString: string): string {
    const iv = randomBytes(12);
    // Pad or slice key to ensure exactly 32 bytes
    const key = Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32));
    const cipher = createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(sessionString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts a session string.
   * 
   * Supports multiple formats for migration:
   * 1. New GCM format: iv:authTag:encrypted (3 parts)
   * 2. Legacy CBC format: iv:encrypted (2 parts)
   * 3. Plaintext (fallback)
   */
  decryptSession(encryptedSession: string): string {
    if (!encryptedSession) return '';

    const parts = encryptedSession.split(':');
    const key = Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32));

    try {
      // 1. New GCM Format (iv:authTag:encrypted)
      if (parts.length === 3) {
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      // 2. Legacy CBC Format (iv:encrypted)
      if (parts.length === 2) {
        const [ivHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        // Legacy used AES-256-CBC
        const decipher = createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      // 3. Fallback: return as-is (plaintext)
      return encryptedSession;
    } catch (error) {
      console.error('Session decryption failed:', error);
      // If decryption fails, it might be plaintext or corrupted. 
      // Return as-is to allow migration script to check it, 
      // but in production this will likely cause a login error which is expected behavior for security.
      return encryptedSession;
    }
  }

  /**
   * Checks if a string appears to be encrypted (has the expected format)
   */
  isEncrypted(value: string): boolean {
    const parts = value.split(':');
    return (
      (parts.length === 3 && parts[0].length === 24 && parts[1].length === 32) || // GCM
      (parts.length === 2 && parts[0].length === 32) // Legacy CBC (IV is 16 bytes = 32 hex chars)
    );
  }
}
