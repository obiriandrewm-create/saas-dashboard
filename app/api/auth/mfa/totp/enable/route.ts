import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateTOTPSecret, getTOTPUri, encryptSecret } from '@/lib/crypto'
import prisma from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = generateTOTPSecret()
  const uri = getTOTPUri(secret, session.user.email!)

  // Store encrypted secret temporarily (will be confirmed on verify)
  const encrypted = encryptSecret(secret)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totpSecret: JSON.stringify(encrypted), // Store as JSON string for now
    },
  })

  return NextResponse.json({ secret, uri })
}