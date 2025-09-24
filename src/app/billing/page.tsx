'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { supabase } from '@/core/lib/supabase'

interface Organization {
  id: string
  name: string
  subscription_status: string | null
  subscription_plan: string | null
  stripe_customer_id: string | null
  trial_ends_at: string | null
  current_period_end: string | null
}

export default function BillingPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function fetchOrganization() {
      if (authLoading) return

      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }

        const response = await fetch('/api/organizations', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const { organization } = await response.json()
          if (!organization) {
            router.push('/onboarding')
            return
          }
          setOrganization(organization)
        } else {
          throw new Error('Failed to fetch organization')
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [user, authLoading, router])

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) return

    try {
      setActionLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return

    try {
      setActionLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Stripe billing portal
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create billing portal session')
      }
    } catch (error) {
      console.error('Error creating billing portal session:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'Active' }
      case 'trialing':
        return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Free Trial' }
      case 'past_due':
        return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Past Due' }
      case 'canceled':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Canceled' }
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'No Subscription' }
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization not found</h1>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(organization.subscription_status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your TintOps subscription and billing information</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${statusInfo.bg} ${statusInfo.border} border`}>
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                <span className="font-medium">{statusInfo.label}</span>
              </div>

              {organization.subscription_plan && (
                <div>
                  <span className="text-sm text-gray-500">Plan:</span>
                  <p className="font-medium capitalize">{organization.subscription_plan}</p>
                </div>
              )}

              {organization.trial_ends_at && (
                <div>
                  <span className="text-sm text-gray-500">Trial ends:</span>
                  <p className="font-medium">{formatDate(organization.trial_ends_at)}</p>
                </div>
              )}

              {organization.current_period_end && (
                <div>
                  <span className="text-sm text-gray-500">Next billing date:</span>
                  <p className="font-medium">{formatDate(organization.current_period_end)}</p>
                </div>
              )}

              {organization.stripe_customer_id && (
                <Button
                  onClick={handleManageBilling}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Manage Billing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          {(!organization.subscription_status || organization.subscription_status === 'canceled') && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
                <CardDescription>
                  Start your free 14-day trial, then choose the plan that works best for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Monthly Plan</h3>
                      <Badge variant="outline">$29/month</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Perfect for getting started</p>
                    <Button
                      onClick={() => handleSubscribe('monthly')}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Start Monthly Plan
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Yearly Plan</h3>
                      <div className="text-right">
                        <Badge className="bg-blue-500">Save 17%</Badge>
                        <p className="text-sm font-medium mt-1">$290/year</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">2 months free compared to monthly</p>
                    <Button
                      onClick={() => handleSubscribe('yearly')}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Start Yearly Plan
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  14-day free trial • No commitment • Cancel anytime
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features included */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What&apos;s Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Unlimited customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">SMS automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Team collaboration</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">API access</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}