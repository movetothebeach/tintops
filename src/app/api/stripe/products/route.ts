import { NextResponse } from 'next/server'
import { getActiveProducts } from '@/core/lib/stripe-products'
import { logger } from '@/core/lib/logger'

export async function GET() {
  try {
    const products = await getActiveProducts()

    // Filter to only subscription products for the billing page
    const subscriptionProducts = products.map(product => ({
      ...product,
      prices: product.prices.filter(price => price.type === 'recurring' && price.active)
    })).filter(product => product.prices.length > 0)

    return NextResponse.json({ products: subscriptionProducts })

  } catch (error) {
    logger.error('Error fetching products for API', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}