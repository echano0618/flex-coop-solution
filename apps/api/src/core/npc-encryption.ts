import * as crypto from 'crypto';

/**
 * NPC Data Privacy Act of 2012 - Field-Level Encryption Helper
 * Used to encrypt Sensitive Personal Information (SPI) such as Government ID numbers, TIN, SSS, and Birthdates.
 */
export class NPCEncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SECRET_KEY = Buffer.from(
    process.env.NPC_ENCRYPTION_KEY || 'f1e2d3c4b5a697887766554433221100f1e2d3c4b5a697887766554433221100',
    'hex'
  );

  /**
   * Encrypts plaintext SPI into an IV:AuthTag:Ciphertext string
   */
  static encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.SECRET_KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext back to plaintext SPI
   */
  static decrypt(ciphertextBundle: string): string {
    try {
      const [ivHex, authTagHex, encryptedHex] = ciphertextBundle.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) return ciphertextBundle;

      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        this.SECRET_KEY,
        Buffer.from(ivHex, 'hex')
      );
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '[ENCRYPTED_SPI]';
    }
  }

  /**
   * Masks sensitive identifier for display (e.g., ****-****-1234)
   */
  static mask(value: string): string {
    if (!value || value.length <= 4) return '****';
    const visiblePart = value.slice(-4);
    return '*'.repeat(value.length - 4) + visiblePart;
  }
}
