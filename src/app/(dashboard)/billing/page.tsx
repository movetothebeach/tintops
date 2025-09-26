'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { BillingPortalButton } from '@/components/billing/BillingPortalButton'
import { BillingSkeleton } from '@/components/skeletons/BillingSkeleton'
import { useOrganization } from '@/hooks/useOrganization'

export default function BillingPage() {
  const { organization, isLoading, isError } = useOrganization()

  if (isLoading) {
    return <BillingSkeleton />
  }

  if (isError || !organization) {
    return (
      <div className="p-6">
        <div className="text-red-600">
          Error loading billing data. Please try refreshing the page.
        </div>
      </div>
    )
  }

  // Prepare subscription data
  const subscription = {
    isActive: organization.subscriptionStatus === 'active',
    isTrialing: organization.subscriptionStatus === 'trialing',
    isPastDue: organization.subscriptionStatus === 'past_due',
    isCanceled: organization.subscriptionStatus === 'canceled' || !organization.subscriptionStatus,
    plan: organization.subscriptionPlan,
    trialEndsAt: organization.trialEndsAt ? new Date(organization.trialEndsAt) : null,
    currentPeriodEnd: organization.currentPeriodEnd ? new Date(organization.currentPeriodEnd) : null,
  }

  const getSubscriptionBadge = () => {
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

  return (
    <>
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

            <BillingPortalButton />
          </CardContent>
        </Card>

      </div>
    </>
  )
}