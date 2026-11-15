import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
  typescript: true,
})

export const PLANS = {
  FREE: {
    name: 'Free',
    priceId: process.env.STRIPE_PRICE_FREE!,
    monthlyPrice: 0,
    seatsIncluded: 1,
    features: ['Up to 1 member', 'Community support', 'Basic analytics'],
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    monthlyPrice: 29,
    seatsIncluded: 1,
    overagePrice: 10,
    features: ['Unlimited members', 'Priority support', 'Advanced analytics', 'Custom domains'],
  },
  TEAM: {
    name: 'Team',
    priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
    monthlyPrice: 99,
    seatsIncluded: 5,
    overagePrice: 15,
    features: ['Everything in Pro', 'SSO (SAML/OIDC)', 'Audit logs', 'API access'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
    monthlyPrice: null,
    seatsIncluded: null,
    overagePrice: null,
    features: ['Custom pricing', 'Dedicated support', 'SLA', 'On-premise option', 'Custom contracts'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getPlanFromPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return key as PlanKey
  }
  return null
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata,
}: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    subscription_data: {
      metadata,
    },
  })
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'latest_invoice', 'items.data.price.product'],
  })
}

export async function updateSubscription(subscriptionId: string, params: Stripe.SubscriptionUpdateParams) {
  return stripe.subscriptions.update(subscriptionId, params)
}

export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true) {
  if (atPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
  }
  return stripe.subscriptions.cancel(subscriptionId)
}

export async function resumeSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false })
}

export async function createCustomer(email: string, name: string, metadata?: Record<string, string>) {
  return stripe.customers.create({ email, name, metadata })
}

export async function reportUsage({
  subscriptionItemId,
  quantity,
  timestamp = Math.floor(Date.now() / 1000),
}: {
  subscriptionItemId: string
  quantity: number
  timestamp?: number
}) {
  return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp,
    action: 'increment',
  })
}