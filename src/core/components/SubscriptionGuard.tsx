'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useSubscription } from '@/core/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Calendar, CreditCard } from 'lucide-react'

interface SubscriptionGuardProps {
  children: ReactNode
  fallback?: ReactNode
  requireActive?: boolean
}

export function SubscriptionGuard({
  children,
  fallback,
  requireActive = false
}: SubscriptionGuardProps) {
  const subscription = useSubscription()

  // Show loading state
  if (subscription.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (subscription.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Subscription Error
            </CardTitle>
            <CardDescription>
              There was an error loading your subscription status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{subscription.error}</p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check access requirements
  const hasRequiredAccess = requireActive ? subscription.isActive : subscription.hasAccess

  if (!hasRequiredAccess) {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>
    }

    // Show default subscription required message
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-500" />
              {subscription.isTrialing ? 'Trial Expired' : 'Subscription Required'}
            </CardTitle>
            <CardDescription>
              {subscription.isTrialing
                ? 'Your free trial has ended. Subscribe to continue using TintOps.'
                : 'This feature requires an active subscription.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.isTrialing && subscription.trialEndsAt && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                <div className="flex items-center gap-2 text-orange-800">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Trial ended:</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  {subscription.trialEndsAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/billing">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Questions? Contact support for help.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User has access - render children
  return <>{children}</>
}