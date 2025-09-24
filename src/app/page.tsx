'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/core/contexts/AuthContext'
import { supabase } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [checking, setChecking] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function checkUserAndRedirect() {
      try {
        // Wait for auth to load
        if (authLoading) return

        // If not authenticated, show marketing page
        if (!user) {
          setChecking(false)
          return
        }

        // User is authenticated - check if they have an organization
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const response = await fetch('/api/organizations', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          })

          if (response.ok) {
            let organization
            try {
              const result = await response.json()
              organization = result.organization
            } catch (jsonError) {
              logger.error('Failed to parse organization response', jsonError)
              // Don't throw here since this is just checking if user has org
              return
            }
            if (organization) {
              // Has organization - redirect to dashboard (dashboard will handle subscription check)
              router.push('/dashboard')
              return
            } else {
              // No organization - redirect to onboarding
              router.push('/onboarding')
              return
            }
          }
        }

        // Fallback - show marketing page
        setChecking(false)
      } catch (error) {
        logger.error('Error checking user state', error)
        setChecking(false)
      }
    }

    checkUserAndRedirect()
  }, [user, authLoading, router])

  // Show loading while checking authentication and organization state
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
              TintOps
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 font-medium">
              Complete CRM for Window Tinting Shops
            </p>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Automate your marketing, manage customers, and grow your tinting business
              with our purpose-built platform.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/auth/signup">
                Get Started Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track leads, manage appointments, and maintain customer relationships all in one place.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SMS Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automated follow-ups, appointment reminders, and marketing campaigns via SMS.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track performance, monitor revenue, and make data-driven decisions for your shop.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Development Status */}
          <div className="mt-16 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Development Status:</strong> Phase 4 Complete ✅ - Authentication, Organizations, Security Ready for Phase 5!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}