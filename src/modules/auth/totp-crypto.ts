import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from '../../config/env.js';

/**
 * El secreto TOTP se guarda cifrado con AES-256-GCM.
 * Formato binario: iv (12) | authTag (16) | ciphertext.
 */
export function encryptSecret(plain: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', config.totpEncryptionKey, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]);
}

export function decryptSecret(blob: Buffer): string {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const data = blob.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', config.totpEncryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
