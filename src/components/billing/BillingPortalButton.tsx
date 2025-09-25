'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'
import { createBillingPortalSession } from '@/app/actions/stripe'

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      await createBillingPortalSession()
    } catch (error) {
      console.error('Error opening billing portal:', error)
      alert('Failed to open billing portal. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleManageBilling}
      variant="outline"
      className="w-full"
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4 mr-2" />
      )}
      Manage Subscription
    </Button>
  )
}