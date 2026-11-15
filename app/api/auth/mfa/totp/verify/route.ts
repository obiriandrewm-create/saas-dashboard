import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyTOTPCode, decryptSecret } from '@/lib/crypto'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await request.json()
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.totpSecret) {
    return NextResponse.json({ error: 'TOTP not set up' }, { status: 400 })
  }

  try {
    const encrypted = JSON.parse(user.totpSecret)
    const secret = decryptSecret(encrypted)
    const valid = verifyTOTPCode(secret, code)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Store the confirmed secret (already encrypted)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        // totpSecret already stored from enable step
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}