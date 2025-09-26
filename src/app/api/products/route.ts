import { NextResponse } from 'next/server'
import { createServerClient } from '@/core/lib/supabase/server'
import { getActiveProducts } from '@/core/lib/stripe-products'

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get active Stripe products
    const products = await getActiveProducts()

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}