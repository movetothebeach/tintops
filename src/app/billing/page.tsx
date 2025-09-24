'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { supabase } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'
import { StripeProduct, getPricingDisplayInfo } from '@/core/lib/stripe-utils'

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
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
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

        // Fetch both organization and products in parallel
        const [orgResponse, productsResponse] = await Promise.all([
          fetch('/api/organizations', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          fetch('/api/stripe/products')
        ])

        if (orgResponse.ok) {
          let organization
          try {
            const result = await orgResponse.json()
            organization = result.organization
          } catch (jsonError) {
            logger.error('Failed to parse organization response', jsonError)
            throw new Error('Invalid response from server')
          }
          if (!organization) {
            router.push('/onboarding')
            return
          }
          setOrganization(organization)
        } else {
          throw new Error('Failed to fetch organization')
        }

        if (productsResponse.ok) {
          try {
            const result = await productsResponse.json()
            setProducts(result.products || [])
          } catch (jsonError) {
            logger.error('Failed to parse products response', jsonError)
            // Continue without products - will show loading state
          }
        }
      } catch (error) {
        logger.error('Error fetching data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, authLoading, router])

  const handleSubscribe = async (priceId: string) => {
    if (!user || loadingPriceId) return

    try {
      setLoadingPriceId(priceId)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        logger.error('Failed to parse checkout response', jsonError)
        alert('Failed to start checkout - invalid server response')
        return
      }

      if (response.ok) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      logger.error('Error creating checkout session', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoadingPriceId(null)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return

    try {
      setLoadingPriceId('manage')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        logger.error('Failed to parse billing portal response', jsonError)
        alert('Failed to open billing portal - invalid server response')
        return
      }

      if (response.ok) {
        // Redirect to Stripe billing portal
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create billing portal session')
      }
    } catch (error) {
      logger.error('Error creating billing portal session', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoadingPriceId(null)
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

        <div className="grid gap-6">
          {/* Current Subscription Status - Only show if user has active subscription */}
          {(organization.subscription_status && organization.subscription_status !== 'canceled' && organization.subscription_status !== null) && (
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
                    disabled={loadingPriceId === 'manage'}
                    variant="outline"
                    className="w-full"
                  >
                    {loadingPriceId === 'manage' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Manage Billing
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscription Plans */}
          {(!organization.subscription_status || organization.subscription_status === 'canceled') && (
            <div className="col-span-full">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose Your TintOps Plan
                </h2>
                <p className="text-gray-600">
                  Start with TintOps to grow your tint business.
                </p>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-500">Loading pricing plans...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {products.map(product =>
                    product.prices
                      .sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0))
                      .map((price) => {
                        const displayInfo = getPricingDisplayInfo(price)
                        const isYearly = price.recurring?.interval === 'year'
                        const monthlyPrice = isYearly ? (price.unit_amount || 0) / 12 / 100 : (price.unit_amount || 0) / 100

                        return (
                          <Card
                            key={price.id}
                            className={`relative ${isYearly ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'} transition-all duration-200`}
                          >
                            {isYearly && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <Badge className="bg-blue-500 text-white px-3 py-1">
                                  Most Popular
                                </Badge>
                              </div>
                            )}

                            <CardHeader className="text-center pb-4">
                              <CardTitle className="text-lg">
                                {isYearly ? 'Annual Plan' : 'Monthly Plan'}
                              </CardTitle>
                              <div className="mt-4">
                                <div className="flex items-center justify-center">
                                  <span className="text-4xl font-bold text-gray-900">
                                    ${Math.round(monthlyPrice)}
                                  </span>
                                  <span className="text-gray-500 ml-2">/month</span>
                                </div>
                                {isYearly && products.length > 0 && (
                                  (() => {
                                    // Find monthly price for comparison
                                    const monthlyPriceItem = products[0].prices.find(p => p.recurring?.interval === 'month')
                                    const yearlyPriceItem = price

                                    if (monthlyPriceItem && yearlyPriceItem.unit_amount && monthlyPriceItem.unit_amount) {
                                      const yearlyTotal = yearlyPriceItem.unit_amount / 100
                                      const monthlyTotal = (monthlyPriceItem.unit_amount / 100) * 12
                                      const savings = Math.round(monthlyTotal - yearlyTotal)

                                      return savings > 0 ? (
                                        <div className="mt-1">
                                          <span className="text-sm text-green-600 font-medium">
                                            Save ${savings}/year
                                          </span>
                                        </div>
                                      ) : null
                                    }
                                    return null
                                  })()
                                )}
                                <div className="text-sm text-gray-500 mt-2">
                                  {isYearly ? `Billed annually (${displayInfo.amount})` : 'Billed monthly'}
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                              <Button
                                onClick={() => handleSubscribe(price.id)}
                                disabled={loadingPriceId === price.id}
                                className="w-full mb-6"
                                size="lg"
                                variant={isYearly ? 'default' : 'outline'}
                              >
                                {loadingPriceId === price.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                {displayInfo.trialDays ? 'Start Free Trial' : 'Subscribe Now'}
                              </Button>

                              <div className="space-y-3 text-sm">
                                {displayInfo.trialDays && (
                                  <div className="flex items-center">
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                    <span>{displayInfo.trialDays}-day free trial</span>
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                  <span>Unlimited customers & jobs</span>
                                </div>
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                  <span>SMS automation & follow-ups</span>
                                </div>
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                  <span>Team collaboration tools</span>
                                </div>
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                  <span>Analytics & reporting</span>
                                </div>
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                                  <span>Priority email support</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                  )}
                </div>
              )}

              <div className="text-center mt-8">
                <p className="text-sm text-gray-500">
                  🔒 Secure payment processing by Stripe • Cancel anytime
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}