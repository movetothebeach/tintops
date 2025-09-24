// Client-safe Stripe utilities (no server imports)

export interface StripeProduct {
  id: string
  name: string
  description: string | null
  prices: StripePrice[]
}

export interface StripePrice {
  id: string
  product: string
  unit_amount: number | null
  currency: string
  recurring: {
    interval: 'month' | 'year'
    interval_count: number
    trial_period_days: number | null
  } | null
  type: 'one_time' | 'recurring'
  active: boolean
}

export function formatPrice(price: StripePrice): string {
  if (!price.unit_amount) return 'Free'

  const amount = price.unit_amount / 100
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency.toUpperCase(),
  })

  return formatter.format(amount)
}

export function getPricingDisplayInfo(price: StripePrice): {
  amount: string
  interval: string
  trialDays: number | null
} {
  return {
    amount: formatPrice(price),
    interval: price.recurring ? `/${price.recurring.interval}` : '',
    trialDays: price.recurring?.trial_period_days || null
  }
}