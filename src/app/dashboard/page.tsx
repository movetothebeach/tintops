'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/contexts/AuthContext'
import { useOrganization } from '@/core/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const { organization, loading: orgLoading } = useOrganization()
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
  }, [user, organization, authLoading, orgLoading, router])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  // Show loading while checking authentication
  if (authLoading || orgLoading) {
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

  return (
    <div className="container mx-auto p-6">
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
        <Card>
          <CardHeader>
            <CardTitle>Welcome to TintOps!</CardTitle>
            <CardDescription>
              Your organization has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email: {user?.email}</p>
              <p>Organization: {organization?.name}</p>
              <p>Status: {organization?.subscription_status}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phase 4 Complete</CardTitle>
            <CardDescription>
              Authentication & Organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>✅ User authentication</li>
              <li>✅ Organization creation</li>
              <li>✅ Multi-tenant setup</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming Next</CardTitle>
            <CardDescription>
              Phase 5: Stripe Billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li>⏳ Subscription management</li>
              <li>⏳ Payment processing</li>
              <li>⏳ Billing portal</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}