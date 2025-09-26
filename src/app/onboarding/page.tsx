'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'
import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingPage() {
  const router = useRouter()
  const { data: userData } = useSWR('/api/user')
  const { data: orgData } = useSWR('/api/organization')

  useEffect(() => {
    // If user already has organization, redirect to dashboard
    if (orgData?.organization) {
      router.push('/dashboard')
    }
  }, [orgData, router])

  // Get user's full name from metadata
  const fullName = userData?.user?.metadata?.full_name || ''

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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