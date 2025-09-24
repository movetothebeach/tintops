import { stripe } from './stripe'
import { logger } from './logger'

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

// Cache products for 5 minutes to avoid excessive API calls
let productsCache: { data: StripeProduct[]; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getActiveProducts(): Promise<StripeProduct[]> {
  try {
    // Return cached data if still valid
    if (productsCache && Date.now() - productsCache.timestamp < CACHE_DURATION) {
      return productsCache.data
    }

    logger.info('Fetching products from Stripe API')

    // Fetch products and their prices in parallel
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 })
    ])

    // Group prices by product
    const pricesByProduct = new Map<string, StripePrice[]>()

    prices.data.forEach(price => {
      const productId = typeof price.product === 'string' ? price.product : price.product.id

      if (!pricesByProduct.has(productId)) {
        pricesByProduct.set(productId, [])
      }

      pricesByProduct.get(productId)!.push({
        id: price.id,
        product: productId,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring ? {
          interval: price.recurring.interval as 'month' | 'year',
          interval_count: price.recurring.interval_count,
          trial_period_days: price.recurring.trial_period_days
        } : null,
        type: price.type as 'one_time' | 'recurring',
        active: price.active
      })
    })

    // Build product objects with their prices
    const productData: StripeProduct[] = products.data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      prices: pricesByProduct.get(product.id) || []
    }))

    // Cache the results
    productsCache = {
      data: productData,
      timestamp: Date.now()
    }

    logger.info('Successfully fetched and cached products', {
      productCount: productData.length,
      totalPrices: prices.data.length
    })

    return productData

  } catch (error) {
    logger.error('Error fetching Stripe products', error)

    // Return cached data if available, even if expired
    if (productsCache) {
      logger.warn('Returning stale product cache due to API error')
      return productsCache.data
    }

    throw new Error('Failed to fetch products from Stripe')
  }
}

export function getTrialDaysForPrice(products: StripeProduct[], priceId: string): number {
  for (const product of products) {
    const price = product.prices.find(p => p.id === priceId)
    if (price?.recurring?.trial_period_days) {
      return price.recurring.trial_period_days
    }
  }

  // Fallback to default if not specified in Stripe
  return 14
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