'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { createCheckoutSession } from '@/app/actions/stripe'

interface CheckoutButtonProps {
  priceId: string
  isPopular?: boolean
  trialDays?: number
}

export function CheckoutButton({ priceId, isPopular, trialDays }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      await createCheckoutSession(priceId)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full"
      variant={isPopular ? 'default' : 'outline'}
      size="lg"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        trialDays && trialDays > 0
          ? `Start ${trialDays}-Day Free Trial`
          : 'Get Started'
      )}
    </Button>
  )
}