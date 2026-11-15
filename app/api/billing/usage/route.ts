import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    return NextResponse.json({ usage: [] })
  }

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const usage = await prisma.usageRecord.findMany({
    where: {
      organizationId: orgId,
      subscriptionId: subscription.id,
      timestamp: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { timestamp: 'desc' },
  })

  // Aggregate by metric
  const aggregated = usage.reduce((acc, record) => {
    if (!acc[record.metric]) {
      acc[record.metric] = { metric: record.metric, current: 0, limit: null }
    }
    acc[record.metric].current += record.quantity
    return acc
  }, {} as Record<string, { metric: string; current: number; limit: number | null }>)

  // Add limits based on plan (simplified)
  const limits: Record<string, number | null> = {
    api_calls: 100000,
    seats: 5,
    storage_gb: 10,
    projects: 10,
  }

  const result = Object.entries(aggregated).map(([metric, data]) => ({
    metric,
    current: data.current,
    limit: limits[metric] || null,
    percentage: limits[metric] ? Math.min(100, (data.current / limits[metric]!) * 100) : 0,
  }))

  return NextResponse.json({ usage: result })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = session.memberships?.[0]?.organization?.id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { metric, quantity } = await request.json()
  if (!metric || typeof quantity !== 'number') {
    return NextResponse.json({ error: 'Invalid metric or quantity' }, { status: 400 })
  }

  const subscription = await prisma.subscription.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  })

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  const usageRecord = await prisma.usageRecord.create({
    data: {
      organizationId: orgId,
      subscriptionId: subscription.id,
      metric,
      quantity,
    },
  })

  return NextResponse.json({ usageRecord })
}