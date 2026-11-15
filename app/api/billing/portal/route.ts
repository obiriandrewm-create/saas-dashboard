import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createPortalSession } from '@/lib/stripe'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.memberships?.[0]?.organization?.id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })
  }

  const portalSession = await createPortalSession({
    customerId: org.stripeCustomerId,
    returnUrl: `${process.env.AUTH_URL}/dashboard/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}