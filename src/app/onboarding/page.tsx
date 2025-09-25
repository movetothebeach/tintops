import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerClient } from '@/core/lib/supabase/server'
import { organizationService } from '@/core/lib/organizations'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'


export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check authentication
  if (!user) {
    redirect('/auth/login')
  }

  // Check if user already has an organization
  const { organization } = await organizationService.getOrganizationByUserId(user.id)
  if (organization) {
    redirect('/dashboard')
  }

  // Get user's full name from metadata
  const fullName = user.user_metadata?.full_name || ''


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to TintOps!
          </h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s set up your tint shop organization
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Setup</CardTitle>
            <CardDescription>
              Create your organization to get started with TintOps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm defaultFullName={fullName} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}