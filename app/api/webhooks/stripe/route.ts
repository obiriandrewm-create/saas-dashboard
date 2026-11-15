import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { getRedis } from '@/middleware'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

async function handleWebhook(event: Stripe.Event) {
  const redis = getRedis()
  const key = `webhook:${event.id}`
  const existing = await redis.get(key)
  if (existing) return { received: true, duplicate: true }

  await redis.setex(key, 604800, JSON.stringify({ status: 'processed', processedAt: new Date().toISOString() }))

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
    }
  } catch (error) {
    console.error(`Webhook handler failed for ${event.type}:`, error)
    throw error
  }

  return { received: true }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.orgId
  if (!orgId) return

  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? getPlanFromPriceId(priceId) : null

  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        organizationId: orgId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId!,
        status: mapSubscriptionStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        quantity: subscription.quantity,
        metadata: subscription.metadata as any,
      },
      update: {
        stripePriceId: priceId!,
        status: mapSubscriptionStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        quantity: subscription.quantity,
        metadata: subscription.metadata as any,
      },
    })

    if (plan) {
      await tx.organization.update({
        where: { id: orgId },
        data: { plan: plan },
      })
    }

    await tx.auditLog.create({
      data: {
        organizationId: orgId,
        action: 'subscription.update',
        resourceType: 'subscription',
        resourceId: subscription.id,
        metadata: { stripeStatus: subscription.status, plan },
        severity: 'INFO',
      },
    })
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.orgId
  if (!orgId) return

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    })

    await tx.organization.update({
      where: { id: orgId },
      data: { plan: 'FREE' },
    })

    await tx.auditLog.create({
      data: {
        organizationId: orgId,
        action: 'subscription.cancel',
        resourceType: 'subscription',
        resourceId: subscription.id,
        metadata: { reason: 'stripe_webhook' },
        severity: 'WARNING',
      },
    })
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const orgId = subscription.metadata.orgId
  if (!orgId) return

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      organizationId: orgId,
      stripeInvoiceId: invoice.id,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: mapInvoiceStatus(invoice.status),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdfUrl: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    },
    update: {
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      status: mapInvoiceStatus(invoice.status),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdfUrl: invoice.invoice_pdf,
    },
  })

  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      action: 'invoice.payment_succeeded',
      resourceType: 'invoice',
      resourceId: invoice.id,
      metadata: { amount: invoice.amount_paid, currency: invoice.currency },
      severity: 'INFO',
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
  const orgId = subscription.metadata.orgId
  if (!orgId) return

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      organizationId: orgId,
      stripeInvoiceId: invoice.id,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      amountRemaining: invoice.amount_remaining,
      currency: invoice.currency,
      status: mapInvoiceStatus(invoice.status),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdfUrl: invoice.invoice_pdf,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    },
    update: {
      status: mapInvoiceStatus(invoice.status),
    },
  })

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'PAST_DUE' },
  })

  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      action: 'invoice.payment_failed',
      resourceType: 'invoice',
      resourceId: invoice.id,
      metadata: { amount: invoice.amount_due, currency: invoice.currency, attempt: invoice.attempt_count },
      severity: 'ERROR',
    },
  })
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  const orgId = customer.metadata.orgId
  if (!orgId) return

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      // Could sync email, metadata, etc.
    },
  })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const orgId = subscription.metadata.orgId
    if (!orgId) return

    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        action: 'checkout.completed',
        resourceType: 'subscription',
        resourceId: subscription.id,
        metadata: { sessionId: session.id },
        severity: 'INFO',
      },
    })
  }
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAUSED' | 'UNPAID' {
  const map: Record<string, any> = {
    trialing: 'TRIALING',
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    paused: 'PAUSED',
    unpaid: 'UNPAID',
  }
  return map[status] || 'INCOMPLETE'
}

function mapInvoiceStatus(status: string): 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE' {
  const map: Record<string, any> = {
    draft: 'DRAFT',
    open: 'OPEN',
    paid: 'PAID',
    void: 'VOID',
    uncollectible: 'UNCOLLECTIBLE',
  }
  return map[status] || 'OPEN'
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

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await handleWebhook(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook processing failed:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}