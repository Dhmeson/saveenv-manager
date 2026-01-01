import type {  StoredProject } from '@prisma/client'

export class CryptoService {
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
  }

  static base64ToUint8(base64: string): Uint8Array {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i += 1) bytes[i] = binaryString.charCodeAt(i)
    return bytes
  }

  static async hashWithSaltBase64(plain: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder()
    const plainBytes = encoder.encode(plain)
    const combined = new Uint8Array(salt.byteLength + plainBytes.byteLength)
    combined.set(salt, 0)
    combined.set(plainBytes, salt.byteLength)
    const digest = await crypto.subtle.digest('SHA-256', combined.buffer as ArrayBuffer)
    return this.arrayBufferToBase64(digest)
  }

  static async computeSaltedHashBase64(plain: string): Promise<{ hashBase64: string; saltBase64: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const hashBase64 = await this.hashWithSaltBase64(plain, salt)
    const saltBase64 = this.arrayBufferToBase64(salt.buffer)
    return { hashBase64, saltBase64 }
  }

  static async verifySaltedHash(plain: string, hashBase64?: string | null, saltBase64?: string | null): Promise<boolean> {
    if (!hashBase64 || !saltBase64) return true
    const saltBytes = this.base64ToUint8(saltBase64)
    const candidate = await this.hashWithSaltBase64(plain, saltBytes)
    return candidate === hashBase64
  }

  static async deriveAesGcmKeyFromSecret(secret: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const baseKey = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'PBKDF2' }, false, ['deriveKey'])
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static preferSecretFromMaster(master: any): string | null {
    return (master.valueHash as string | null) || (master.encryptedValue as string | null) || null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getSecretForMasterOrThrow(master: any, typedPrivate?: string): Promise<string> {
    const typed = (typedPrivate || '').trim()
    if (typed) {
      const ok = await this.verifySaltedHash(typed, master.valueHash || null, master.valueHashSalt || null)
      if (!ok) throw new Error('invalid-private-key')
      const s = this.preferSecretFromMaster(master)
      if (!s) throw new Error('missing-master-secret')
      return s
    }
    const s = this.preferSecretFromMaster(master)
    if (!s) throw new Error('missing-master-secret')
    return s
  }

  static async encrypt(plaintext: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await this.deriveAesGcmKeyFromSecret(secret, salt)
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      (encoder.encode(plaintext).buffer as ArrayBuffer)
    )
    const combined = new Uint8Array(salt.byteLength + iv.byteLength + new Uint8Array(ciphertext).byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.byteLength)
    combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength)
    return `v1:${this.arrayBufferToBase64(combined.buffer)}`
  }

  static async decrypt(encrypted: string, secret: string): Promise<string> {
    if (!encrypted || !encrypted.startsWith('v1:')) throw new Error('unsupported-format')
    const decoder = new TextDecoder()
    const dataB64 = encrypted.slice(3)
    const bytes = this.base64ToUint8(dataB64)
    const salt = bytes.slice(0, 16)
    const iv = bytes.slice(16, 28)
    const cipher = bytes.slice(28)
    const key = await this.deriveAesGcmKeyFromSecret(secret, salt)
    const plaintextBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      (cipher.buffer as ArrayBuffer)
    )
    return decoder.decode(plaintextBuf)
  }

  // For master key storage where we intentionally cannot decrypt later
  static async encryptEphemeral(plaintext: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      (data.buffer as ArrayBuffer)
    )
    const ivAndCipher = new Uint8Array(iv.byteLength + new Uint8Array(ciphertext).byteLength)
    ivAndCipher.set(iv, 0)
    ivAndCipher.set(new Uint8Array(ciphertext), iv.byteLength)
    return this.arrayBufferToBase64(ivAndCipher.buffer)
  }

  static async decryptProjectVariables(project: StoredProject & { variables: { name: string; encrypted: string }[] }, secret: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    for (const v of project.variables) {
      try {
        out[v.name] = await this.decrypt(v.encrypted, secret)
      } catch {
        // skip unsupported or failed
      }
    }
    return out
  }

  static async encryptVariables(variables: Array<{ name: string; value: string }>, secret: string): Promise<Array<{ name: string; encrypted: string }>> {
    const out: Array<{ name: string; encrypted: string }> = []
    for (const v of variables) {
      const encrypted = await this.encrypt(v.value, secret)
      out.push({ name: v.name, encrypted })
    }
    return out
  }
}


