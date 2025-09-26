import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { BillingPortalButton } from '@/components/billing/BillingPortalButton'
import { getUserWithOrganization } from '@/core/lib/data/cached-queries'
import { redirect } from 'next/navigation'

export default async function BillingPage() {
  // Use cached queries - these will be the same instances from the layout
  const { user, organization } = await getUserWithOrganization()

  // Safety checks (should not happen as layout already redirects)
  if (!user || !organization) {
    redirect('/auth/login')
  }

  // Prepare subscription data
  const subscription = {
    isActive: organization.subscription_status === 'active',
    isTrialing: organization.subscription_status === 'trialing',
    isPastDue: organization.subscription_status === 'past_due',
    isCanceled: organization.subscription_status === 'canceled' || !organization.subscription_status,
    plan: organization.subscription_plan,
    trialEndsAt: organization.trial_ends_at ? new Date(organization.trial_ends_at) : null,
    currentPeriodEnd: organization.current_period_end ? new Date(organization.current_period_end) : null,
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