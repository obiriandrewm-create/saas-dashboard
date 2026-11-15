import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvitationToken, hashInvitationToken } from '@/lib/crypto'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.memberships?.[0]?.organization?.id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
  })
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, role } = await request.json()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const existingMember = await prisma.organizationMember.findFirst({
    where: { organizationId: orgId, user: { email } },
  })
  if (existingMember) {
    return NextResponse.json({ error: 'User already a member' }, { status: 409 })
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: { organizationId: orgId, email, acceptedAt: null },
  })
  if (existingInvite) {
    return NextResponse.json({ error: 'Invitation already pending' }, { status: 409 })
  }

  const token = generateInvitationToken()
  const tokenHash = hashInvitationToken(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: orgId,
      email,
      role: role || 'MEMBER',
      token: tokenHash,
      invitedBy: session.user.id,
      expiresAt,
    },
  })

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  await sendInvitationEmail(email, org?.name || 'Organization', token)

  return NextResponse.json({
    invitation: { id: invitation.id, email, role: invitation.role, expiresAt },
  })
}