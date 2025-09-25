import Link from 'next/link'
import { createServerClient } from '@/core/lib/supabase/server'
import { organizationService } from '@/core/lib/organizations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Users, MessageSquare } from 'lucide-react'
import { SignOutButton } from '@/components/dashboard/SignOutButton'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { organization } = await organizationService.getOrganizationByUserId(user.id)

  if (!organization) {
    redirect('/onboarding')
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {organization?.name || 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {organization?.subdomain}.tintops.app
          </p>
        </div>
        <SignOutButton />
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
    </>
  )
}