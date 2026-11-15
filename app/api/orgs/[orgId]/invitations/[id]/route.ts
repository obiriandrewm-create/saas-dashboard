import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId, id } = await params

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
  })
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const invitation = await prisma.invitation.findUnique({ where: { id } })
  if (!invitation || invitation.organizationId !== orgId) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }

  await prisma.invitation.delete({ where: { id } })

  return NextResponse.json({ success: true })
}