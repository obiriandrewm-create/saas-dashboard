import { hash, verify } from '@node-rs/argon2'
import { generateSecret, verify as verifyTOTP } from 'otplib'
import { encrypt, decrypt } from '@node-rs/aes'
import { randomBytes, createHash } from 'crypto'

// ============================================
// PASSWORD HASHING (Argon2id)
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 64 * 1024, // 64 MB
    timeCost: 3,           // 3 iterations
    parallelism: 4,        // 4 threads
    outputLen: 32,
    type: 'Argon2id',
  })
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await verify(hash, password)
  } catch {
    return false
  }
}

// ============================================
// TOTP (Time-based One-Time Password)
// ============================================

export function generateTOTPSecret(): string {
  return generateSecret(20) // 160-bit secret
}

export function getTOTPUri(secret: string, email: string, issuer = 'SaaS Dashboard'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    return verifyTOTP(code, secret)
  } catch {
    return false
  }
}

// Generate backup codes (8 codes, 8 chars each)
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(4).toString('hex').toUpperCase())
  }
  return codes
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => hashPassword(code)))
}

export async function verifyBackupCode(hashedCodes: string[], code: string): Promise<{ valid: boolean; remaining: string[] }> {
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await verifyPassword(code, hashedCodes[i])) {
      const remaining = [...hashedCodes]
      remaining.splice(i, 1)
      return { valid: true, remaining }
    }
  }
  return { valid: false, remaining: hashedCodes }
}

// ============================================
// ENVELOPE ENCRYPTION (for TOTP secrets, etc.)
// ============================================

interface EncryptedData {
  ciphertext: string
  iv: string
  keyVersion: number
}

function getEncryptionKey(): { key: Uint8Array; version: number } {
  const keyB64 = process.env.ENCRYPTION_KEY
  const version = parseInt(process.env.ENCRYPTION_KEY_VERSION || '1', 10)
  if (!keyB64) throw new Error('ENCRYPTION_KEY not configured')
  return { key: Uint8Array.from(atob(keyB64), c => c.charCodeAt(0)), version }
}

export function encryptSecret(plaintext: string): EncryptedData {
  const { key, version } = getEncryptionKey()
  const iv = randomBytes(12)
  const ciphertext = encrypt(key, new TextEncoder().encode(plaintext), iv)
  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    keyVersion: version,
  }
}

export function decryptSecret(data: EncryptedData): string {
  const { key } = getEncryptionKey()
  const plaintext = decrypt(
    key,
    Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0)),
    Uint8Array.from(atob(data.iv), c => c.charCodeAt(0))
  )
  return new TextDecoder().decode(plaintext)
}

// Rotate encryption key (call from cron job)
export async function rotateEncryptionKey(newKeyB64: string): Promise<void> {
  // This would be a background job that:
  // 1. Sets ENCRYPTION_KEY_PREVIOUS = ENCRYPTION_KEY
  // 2. Sets ENCRYPTION_KEY = newKeyB64
  // 3. Increments ENCRYPTION_KEY_VERSION
  // 4. Re-encrypts all TOTP secrets with new key
  // Implementation requires database migration script
  throw new Error('Not implemented - run as background job')
}

// ============================================
// SESSION TOKENS
// ============================================

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateApiKeyPrefix(): string {
  return `sk_${randomBytes(4).toString('hex')}`
}

export function generateApiKey(): { prefix: string; key: string; hash: string } {
  const prefix = generateApiKeyPrefix()
  const key = `${prefix}_${randomBytes(24).toString('base64url')}`
  const hash = createHash('sha256').update(key).digest('hex')
  return { prefix, key, hash }
}

// ============================================
// INVITATION TOKENS
// ============================================

export function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// ============================================
// CSRF TOKENS
// ============================================

export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashCsrfToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}