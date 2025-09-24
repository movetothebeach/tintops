'use client'

import { useAuth } from '@/core/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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
            <p className="text-sm text-muted-foreground">
              Email: {user?.email}
            </p>
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