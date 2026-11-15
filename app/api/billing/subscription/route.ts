import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createCheckoutSession, createPortalSession, getSubscription, updateSubscription, cancelSubscription, resumeSubscription } from '@/lib/stripe'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.memberships?.[0]?.organization?.id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) {
    return NextResponse.json({ plan: 'FREE', status: null })
  }

  let stripeSub: any = null
  if (subscription.stripeSubscriptionId) {
    try {
      stripeSub = await getSubscription(subscription.stripeSubscriptionId)
    } catch {
      // Ignore Stripe errors
    }
  }

  return NextResponse.json({
    plan: subscription.stripePriceId ? getPlanFromPriceId(subscription.stripePriceId) : 'FREE',
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    stripeSubscription: stripeSub ? {
      id: stripeSub.id,
      status: stripeSub.status,
      currentPeriodEnd: stripeSub.current_period_end,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      items: stripeSub.items.data.map((item: any) => ({
        priceId: item.price.id,
        quantity: item.quantity,
      })),
    } : null,
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.memberships?.[0]?.organization?.id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body = await request.json()
  const { priceId, action } = body

  if (action === 'create_checkout') {
    if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

    const org = await prisma.organization.findUnique({ where: { id: orgId } })
    if (!org?.stripeCustomerId) {
      const customer = await createStripeCustomer(orgId, org!.name, session.user.email!)
      await prisma.organization.update({ where: { id: orgId }, data: { stripeCustomerId: customer.id } })
    }

    const checkoutSession = await createCheckoutSession({
      customerId: org!.stripeCustomerId!,
      priceId,
      successUrl: `${process.env.AUTH_URL}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.AUTH_URL}/dashboard/billing?canceled=true`,
      metadata: { orgId },
    })

    return NextResponse.json({ url: checkoutSession.url })
  }

  if (action === 'cancel') {
    const subscription = await prisma.subscription.findFirst({ where: { organizationId: orgId } })
    if (!subscription?.stripeSubscriptionId) return NextResponse.json({ error: 'No subscription' }, { status: 400 })

    await cancelSubscription(subscription.stripeSubscriptionId, true)
    return NextResponse.json({ success: true })
  }

  if (action === 'resume') {
    const subscription = await prisma.subscription.findFirst({ where: { organizationId: orgId } })
    if (!subscription?.stripeSubscriptionId) return NextResponse.json({ error: 'No subscription' }, { status: 400 })

    await resumeSubscription(subscription.stripeSubscriptionId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function createStripeCustomer(orgId: string, name: string, email: string) {
  const { stripe } = await import('@/lib/stripe')
  return stripe.customers.create({
    email,
    name,
    metadata: { orgId },
  })
}

function getPlanFromPriceId(priceId: string): 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE' | null {
  const plans = {
    FREE: process.env.STRIPE_PRICE_FREE,
    PRO: process.env.STRIPE_PRICE_PRO_MONTHLY,
    TEAM: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  }
  for (const [key, id] of Object.entries(plans)) {
    if (id === priceId) return key as any
  }
  return null
}