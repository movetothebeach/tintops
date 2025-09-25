'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useOrganization } from '@/core/contexts/OrganizationContext'
import { useSubscription } from '@/core/hooks/useSubscription'
import { DashboardLayout } from '@/components/dashboard-layout'
import { supabase } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { organization, loading: orgLoading } = useOrganization()
  const subscription = useSubscription()
  const router = useRouter()

  useEffect(() => {
    if (authLoading || orgLoading || subscription.loading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!organization) {
      router.push('/onboarding')
      return
    }

    // Redirect to subscription setup if no active subscription
    if (!subscription.hasAccess) {
      router.push('/subscription-setup')
      return
    }
  }, [user, organization, authLoading, orgLoading, subscription, router])


  const handleManageBilling = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      logger.error('Error opening billing portal', error)
      alert('Failed to open billing portal. Please try again.')
    }
  }

  const getSubscriptionBadge = () => {
    if (subscription.loading) return <Badge variant="outline">Loading...</Badge>

    if (subscription.isActive) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
    }

    if (subscription.isTrialing) {
      const daysLeft = subscription.trialEndsAt ?
        Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Trial ({daysLeft} days left)</Badge>
    }

    if (subscription.isPastDue) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Past Due</Badge>
    }

    return <Badge variant="outline">No Subscription</Badge>
  }

  if (authLoading || orgLoading || subscription.loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user || !organization || !subscription.hasAccess) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details
          </p>
        </div>

        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Subscription
              {getSubscriptionBadge()}
            </CardTitle>
            <CardDescription>
              Your current billing status and plan information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscription.plan && (
              <div>
                <span className="text-sm text-muted-foreground">Plan:</span>
                <p className="font-medium capitalize">{subscription.plan}</p>
              </div>
            )}

            {subscription.trialEndsAt && subscription.isTrialing && (
              <div>
                <span className="text-sm text-muted-foreground">Trial ends:</span>
                <p className="font-medium">
                  {subscription.trialEndsAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}

            {subscription.currentPeriodEnd && subscription.isActive && (
              <div>
                <span className="text-sm text-muted-foreground">Next billing:</span>
                <p className="font-medium">
                  {subscription.currentPeriodEnd.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}

            <Button
              onClick={handleManageBilling}
              variant="outline"
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}