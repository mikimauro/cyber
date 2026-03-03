import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Servizio per la crittografia dei dati sensibili
 * Usa AES-256-GCM per cifratura autenticata
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;
  private readonly masterKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY non configurata');
    }
    // Deriva una chiave a 256 bit dalla chiave master
    this.masterKey = crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Cifra un testo
   * @param text Testo da cifrare
   * @returns Stringa cifrata in formato base64 (iv:authTag:ciphertext)
   */
  encrypt(text: string): string {
    try {
      // Genera IV casuale
      const iv = crypto.randomBytes(this.ivLength);
      
      // Crea cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      
      // Cifra
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Ottieni auth tag
      const authTag = cipher.getAuthTag();
      
      // Combini IV + authTag + ciphertext
      const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
      
      return result.toString('base64');
    } catch (error) {
      this.logger.error('Errore durante la cifratura:', error);
      throw new Error('Errore di cifratura');
    }
  }

  /**
   * Decifra un testo
   * @param encryptedData Dati cifrati in formato base64
   * @returns Testo decifrato
   */
  decrypt(encryptedData: string): string {
    try {
      // Decodifica da base64
      const data = Buffer.from(encryptedData, 'base64');
      
      // Estrai componenti
      const iv = data.subarray(0, this.ivLength);
      const authTag = data.subarray(this.ivLength, this.ivLength + this.authTagLength);
      const ciphertext = data.subarray(this.ivLength + this.authTagLength);
      
      // Crea decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decifra
      let decrypted = decipher.update(ciphertext.toString('base64'), 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Errore durante la decifratura:', error);
      throw new Error('Errore di decifratura - dati corrotti o chiave errata');
    }
  }

  /**
   * Genera un hash SHA-256
   * @param data Dati da hashare
   * @returns Hash esadecimale
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Genera un hash con salt per password
   * @param data Dati da hashare
   * @param salt Salt opzionale
   * @returns Hash con salt
   */
  hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, usedSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: usedSalt };
  }

  /**
   * Verifica un hash con salt
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const computed = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
  }

  /**
   * Genera una chiave API casuale
   */
  generateApiKey(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Cifra un oggetto JSON
   */
  encryptObject<T>(obj: T): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decifra un oggetto JSON
   */
  decryptObject<T>(encryptedData: string): T {
    return JSON.parse(this.decrypt(encryptedData)) as T;
  }
}
