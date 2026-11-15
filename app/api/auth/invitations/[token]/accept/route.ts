import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hashInvitationToken } from '@/lib/crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await params
  const tokenHash = hashInvitationToken(token)

  const invitation = await prisma.invitation.findFirst({
    where: { token: tokenHash, acceptedAt: null, expiresAt: { gt: new Date() } },
    include: { organization: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
  }

  if (invitation.email !== session.user.email) {
    return NextResponse.json({ error: 'This invitation is for a different email address' }, { status: 403 })
  }

  const existingMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: invitation.organizationId, userId: session.user.id } },
  })

  if (existingMember) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: invitation.role,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    })

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })

    await tx.auditLog.create({
      data: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
        action: 'member.join',
        resourceType: 'member',
        resourceId: session.user.id,
        metadata: { invitedBy: invitation.invitedBy, role: invitation.role },
        severity: 'INFO',
      },
    })
  })

  return NextResponse.json({ success: true, organizationId: invitation.organizationId })
}