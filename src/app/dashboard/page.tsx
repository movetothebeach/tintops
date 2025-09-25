'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/core/contexts/AuthContext'
import { useOrganization } from '@/core/contexts/OrganizationContext'
import { useSubscription } from '@/core/hooks/useSubscription'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Users, MessageSquare } from 'lucide-react'

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { organization, loading: orgLoading } = useOrganization()
  const subscription = useSubscription()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    // Redirect to onboarding if authenticated but no organization
    if (!authLoading && !orgLoading && user && !organization) {
      router.push('/onboarding')
      return
    }

    // Redirect to subscription setup if user has organization but no subscription access
    if (!authLoading && !orgLoading && !subscription.loading &&
        user && organization && !subscription.hasAccess) {
      router.push('/subscription-setup')
      return
    }
  }, [user, organization, subscription, authLoading, orgLoading, router])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }


  // Show loading while checking authentication, organization, and subscription
  if (authLoading || orgLoading || subscription.loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  // Don't render content if not authenticated
  if (!user) {
    return null // Will redirect
  }

  // Don't render content if no organization
  if (!organization) {
    return null // Will redirect
  }

  // Don't render content if no subscription access
  if (!subscription.hasAccess) {
    return null // Will redirect to subscription-setup
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {organization?.name || 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {organization?.subdomain}.tintops.app
          </p>
        </div>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              Your TintOps workspace information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{organization?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Subdomain:</span>
                <p className="font-medium">{organization?.subdomain}.tintops.app</p>
              </div>
              <div>
                <span className="text-muted-foreground">Owner:</span>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 5 Complete */}
        <Card>
          <CardHeader>
            <CardTitle>Phase 5 Complete! 🎉</CardTitle>
            <CardDescription>
              Stripe Billing Integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>✅ Subscription management</li>
              <li>✅ Payment processing</li>
              <li>✅ Billing portal</li>
              <li>✅ 14-day free trials</li>
              <li>✅ Webhook handling</li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and navigation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Users className="h-4 w-4 mr-2" />
              Manage Team (Coming Soon)
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS Setup (Coming Soon)
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Billing
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}