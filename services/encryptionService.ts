/**
 * Encryption Service for end-to-end encryption
 * Note: This is a simplified implementation. For production, use a robust encryption library.
 */

/**
 * Simple encryption using Web Crypto API
 * For production, use a more robust solution like libsodium or crypto-js
 */
class EncryptionService {
  private encryptionKey: CryptoKey | null = null;
  private encryptionEnabled: boolean = false;

  /**
   * Initialize encryption with a password
   */
  async initializeEncryption(password: string): Promise<void> {
    try {
      // Derive key from password using PBKDF2
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const salt = encoder.encode('vectorsheet-salt'); // In production, use random salt per user

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      this.encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      this.encryptionEnabled = true;
      localStorage.setItem('encryption_enabled', 'true');
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Failed to initialize encryption');
    }
  }

  /**
   * Encrypt data
   */
  async encrypt(data: string): Promise<string> {
    if (!this.encryptionEnabled || !this.encryptionKey) {
      return data; // Return unencrypted if encryption not enabled
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey!,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionEnabled || !this.encryptionKey) {
      return encryptedData; // Return as-is if encryption not enabled
    }

    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey!,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed - incorrect password or corrupted data');
    }
  }

  /**
   * Encrypt spreadsheet data
   */
  async encryptSpreadsheetData(data: any): Promise<string> {
    const jsonData = JSON.stringify(data);
    return this.encrypt(jsonData);
  }

  /**
   * Decrypt spreadsheet data
   */
  async decryptSpreadsheetData(encryptedData: string): Promise<any> {
    const decrypted = await this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  /**
   * Encrypt AI query
   */
  async encryptQuery(query: string): Promise<string> {
    return this.encrypt(query);
  }

  /**
   * Decrypt AI response
   */
  async decryptResponse(encryptedResponse: string): Promise<string> {
    return this.decrypt(encryptedResponse);
  }

  /**
   * Enable/disable encryption
   */
  setEncryptionEnabled(enabled: boolean): void {
    this.encryptionEnabled = enabled;
    localStorage.setItem('encryption_enabled', String(enabled));
  }

  /**
   * Check if encryption is enabled
   */
  isEncryptionEnabled(): boolean {
    const stored = localStorage.getItem('encryption_enabled');
    return stored === 'true' && this.encryptionKey !== null;
  }

  /**
   * Clear encryption key (for logout)
   */
  clearEncryption(): void {
    this.encryptionKey = null;
    this.encryptionEnabled = false;
    localStorage.removeItem('encryption_enabled');
  }
}

export const encryptionService = new EncryptionService();
