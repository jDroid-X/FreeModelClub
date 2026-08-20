/**
 * CryptoVault.js
 * Purpose: Enterprise AES-256-GCM cryptographic vault for encryption at rest of provider API keys.
 *          Manages secure local machine key in data/.vault_key.
 * Dependencies: crypto, fs, path
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CryptoVault {
  static ALGORITHM = 'aes-256-gcm';
  static IV_LENGTH = 12; // Standard 96-bit IV for GCM
  static TAG_LENGTH = 16; // 128-bit auth tag
  static KEY_PATH = path.join(__dirname, '../../data/.vault_key');
  static _masterKey = null;

  /**
   * Initialize or retrieve the master encryption key
   */
  static getMasterKey() {
    if (this._masterKey) return this._masterKey;

    try {
      const dataDir = path.dirname(this.KEY_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.KEY_PATH)) {
        const raw = fs.readFileSync(this.KEY_PATH, 'utf8').trim();
        if (raw.length === 64) {
          this._masterKey = Buffer.from(raw, 'hex');
          return this._masterKey;
        }
      }

      // Generate a new 256-bit cryptographically random key
      const newKey = crypto.randomBytes(32);
      fs.writeFileSync(this.KEY_PATH, newKey.toString('hex'), { encoding: 'utf8', mode: 0o600 });
      this._masterKey = newKey;
      return this._masterKey;
    } catch (err) {
      console.error('[CryptoVault] Key initialization failed:', err.message);
      // Fallback in-memory key for current process session
      if (!this._masterKey) {
        this._masterKey = crypto.createHash('sha256').update('fmc_default_vault_fallback_salt').digest();
      }
      return this._masterKey;
    }
  }

  /**
   * Encrypt a plaintext string using AES-256-GCM.
   * Format returned: "enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
   */
  static encrypt(plaintext) {
    if (!plaintext || typeof plaintext !== 'string') return plaintext;
    if (plaintext.startsWith('enc:v1:')) return plaintext; // Already encrypted
    if (plaintext === 'ollama-local' || plaintext === 'none' || plaintext === '********') return plaintext;

    try {
      const key = this.getMasterKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err) {
      console.error('[CryptoVault.encrypt] Encryption error:', err.message);
      return plaintext; // Fail-safe fallback to prevent data loss
    }
  }

  /**
   * Decrypt a ciphertext string formatted as "enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
   */
  static decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
    if (!ciphertext.startsWith('enc:v1:')) return ciphertext; // Not encrypted

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 5) return ciphertext;

      const iv = Buffer.from(parts[2], 'hex');
      const authTag = Buffer.from(parts[3], 'hex');
      const encryptedText = parts[4];

      const key = this.getMasterKey();
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('[CryptoVault.decrypt] Decryption error:', err.message);
      return ciphertext;
    }
  }

  /**
   * Check if a given string is in the encrypted format
   */
  static isEncrypted(value) {
    return typeof value === 'string' && value.startsWith('enc:v1:');
  }
}

module.exports = CryptoVault;
