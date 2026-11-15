import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvitationToken, hashInvitationToken } from '@/lib/crypto'
import { sendInvitationEmail } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId } = await params
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
  })
  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)

  const [members, total] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
  ])

  return NextResponse.json({
    data: members,
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId } = await params
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

  // Send invitation email
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  await sendInvitationEmail(email, org?.name || 'Organization', token)

  return NextResponse.json({
    invitation: { id: invitation.id, email, role: invitation.role, expiresAt },
  })
}