import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateBackupCodes, hashBackupCodes } from '@/lib/crypto'
import prisma from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const codes = generateBackupCodes(8)
  const hashedCodes = await hashBackupCodes(codes)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      backupCodes: hashedCodes,
    },
  })

  return NextResponse.json({ codes })
}