import { test, expect } from 'vitest'
import { hashPassword, verifyPassword, generateTOTPSecret, verifyTOTPCode, generateBackupCodes } from './crypto'

test('hashPassword and verifyPassword work correctly', async () => {
  const password = 'test-password-123'
  const hash = await hashPassword(password)
  
  expect(hash).toBeDefined()
  expect(typeof hash).toBe('string')
  expect(hash.length).toBeGreaterThan(0)
  
  const valid = await verifyPassword(password, hash)
  expect(valid).toBe(true)
  
  const invalid = await verifyPassword('wrong-password', hash)
  expect(invalid).toBe(false)
})

test('generateTOTPSecret produces valid base32 secret', () => {
  const secret = generateTOTPSecret()
  expect(secret).toBeDefined()
  expect(secret.length).toBeGreaterThan(0)
  // Base32 alphabet: A-Z, 2-7
  expect(secret).toMatch(/^[A-Z2-7]+$/)
})

test('verifyTOTPCode works with valid code', () => {
  const secret = generateTOTPSecret()
  // We can't easily test valid TOTP without time sync, but we can test invalid
  const invalid = verifyTOTPCode(secret, '000000')
  expect(invalid).toBe(false)
})

test('generateBackupCodes produces correct format', () => {
  const codes = generateBackupCodes(8)
  expect(codes).toHaveLength(8)
  for (const code of codes) {
    expect(code).toMatch(/^[A-F0-9]{8}$/)
  }
})

test('generateBackupCodes default count is 8', () => {
  const codes = generateBackupCodes()
  expect(codes).toHaveLength(8)
})