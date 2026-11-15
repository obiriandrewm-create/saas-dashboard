import { test, expect } from 'vitest'

// Color contrast calculation per WCAG 2.1
function getLuminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function getContrastRatio(hex1: string, hex2: string): number {
  const parseHex = (hex: string) => {
    const clean = hex.replace('#', '')
    const bigint = parseInt(clean, 16)
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
  }

  const [r1, g1, b1] = parseHex(hex1)
  const [r2, g2, b2] = parseHex(hex2)
  const l1 = getLuminance(r1, g1, b1)
  const l2 = getLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Design token color pairs (sRGB fallbacks from globals.css)
const tokenPairs = [
  // Light mode - text on backgrounds (4.5:1 minimum)
  { fg: '#1a1a1a', bg: '#ffffff', min: 4.5, name: 'fg-primary on bg-primary' },
  { fg: '#737373', bg: '#ffffff', min: 4.5, name: 'fg-secondary on bg-primary' },
  { fg: '#999999', bg: '#ffffff', min: 3, name: 'fg-muted on bg-primary (UI)' },
  { fg: '#1a1a1a', bg: '#fafafa', min: 4.5, name: 'fg-primary on bg-secondary' },
  { fg: '#737373', bg: '#fafafa', min: 4.5, name: 'fg-secondary on bg-secondary' },
  { fg: '#1a1a1a', bg: '#f0f0f0', min: 4.5, name: 'fg-primary on bg-tertiary' },
  { fg: '#6366f1', bg: '#ffffff', min: 3, name: 'brand on bg-primary (UI)' },
  { fg: '#ffffff', bg: '#6366f1', min: 4.5, name: 'white on brand' },
  { fg: '#ef4444', bg: '#ffffff', min: 3, name: 'error on bg-primary (UI)' },
  { fg: '#22c55e', bg: '#ffffff', min: 3, name: 'success on bg-primary (UI)' },
  { fg: '#f59e0b', bg: '#ffffff', min: 3, name: 'warning on bg-primary (UI)' },
  { fg: '#e5e5e5', bg: '#ffffff', min: 3, name: 'border on bg-primary (UI)' },

  // Dark mode - text on surfaces (4.5:1 minimum)
  { fg: '#fafafa', bg: '#1a1a1a', min: 4.5, name: 'fg-primary on surface-1 (dark)' },
  { fg: '#b3b3b3', bg: '#1a1a1a', min: 4.5, name: 'fg-secondary on surface-1 (dark)' },
  { fg: '#8c8c8c', bg: '#1a1a1a', min: 3, name: 'fg-muted on surface-1 (dark UI)' },
  { fg: '#fafafa', bg: '#242424', min: 4.5, name: 'fg-primary on surface-2 (dark)' },
  { fg: '#fafafa', bg: '#2d2d2d', min: 4.5, name: 'fg-primary on surface-3 (dark)' },
  { fg: '#a5a5f0', bg: '#1a1a1a', min: 3, name: 'brand on surface-1 (dark UI)' },
  { fg: '#1a1a1a', bg: '#a5a5f0', min: 4.5, name: 'dark on brand (dark)' },
  { fg: '#f87171', bg: '#1a1a1a', min: 3, name: 'error on surface-1 (dark UI)' },
  { fg: '#4ade80', bg: '#1a1a1a', min: 3, name: 'success on surface-1 (dark UI)' },
  { fg: '#fbbf24', bg: '#1a1a1a', min: 3, name: 'warning on surface-1 (dark UI)' },
  { fg: '#404040', bg: '#1a1a1a', min: 3, name: 'border on surface-1 (dark UI)' },
]

for (const { fg, bg, min, name } of tokenPairs) {
  test(`${name} meets ${min}:1 contrast`, () => {
    const ratio = getContrastRatio(fg, bg)
    expect(ratio).toBeGreaterThanOrEqual(min)
  })
}

// Focus ring contrast
test('focus ring on primary background meets 3:1', () => {
  const ratio = getContrastRatio('#6366f1', '#ffffff')
  expect(ratio).toBeGreaterThanOrEqual(3)
})

test('focus ring on dark surface meets 3:1', () => {
  const ratio = getContrastRatio('#818cf8', '#1a1a1a')
  expect(ratio).toBeGreaterThanOrEqual(3)
})