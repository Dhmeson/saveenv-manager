export class SimpleCrypto {
  static textEncoder = new TextEncoder()
  static textDecoder = new TextDecoder()

  static async sha256(input: string): Promise<ArrayBuffer> {
    const data = this.textEncoder.encode(input)
    return crypto.subtle.digest('SHA-256', data)
  }

  static async importKeyFromWord(word: string): Promise<CryptoKey> {
    const hash = await this.sha256(word)
    return crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

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

  static async encrypt(plaintext: string, word: string): Promise<string> {
    const key = await this.importKeyFromWord(word)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      this.textEncoder.encode(plaintext).buffer as ArrayBuffer
    )
    const combined = new Uint8Array(iv.byteLength + new Uint8Array(ciphertext).byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.byteLength)
    return `s1:${this.arrayBufferToBase64(combined.buffer)}`
  }

  static async decrypt(encrypted: string, word: string): Promise<string> {
    if (!encrypted || !encrypted.startsWith('s1:')) throw new Error('unsupported-format')
    const key = await this.importKeyFromWord(word)
    const dataB64 = encrypted.slice(3)
    const bytes = this.base64ToUint8(dataB64)
    const iv = bytes.slice(0, 12)
    const cipher = bytes.slice(12)
    const plaintextBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      cipher.buffer as ArrayBuffer
    )
    return this.textDecoder.decode(plaintextBuf)
  }

  static async encryptVariables(
    variables: Array<{ name: string; value: string }>,
    word: string
  ): Promise<Array<{ name: string; encrypted: string }>> {
    const out: Array<{ name: string; encrypted: string }> = []
    for (const v of variables) {
      const encrypted = await this.encrypt(v.value, word)
      out.push({ name: v.name, encrypted })
    }
    return out
  }

  static async decryptVariables(
    variables: Array<{ name: string; encrypted: string }>,
    word: string
  ): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    for (const v of variables) {
      try {
        out[v.name] = await this.decrypt(v.encrypted, word)
      } catch {
        // ignore failures
      }
    }
    return out
  }
}


