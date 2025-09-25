'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check } from 'lucide-react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useOrganization } from '@/core/contexts/OrganizationContext'
import { useSubscription } from '@/core/hooks/useSubscription'
import { supabase } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'
import { StripeProduct, getPricingDisplayInfo } from '@/core/lib/stripe-utils'

export default function SubscriptionSetupPage() {
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const { organization, loading: orgLoading } = useOrganization()
  const subscription = useSubscription()
  const router = useRouter()

  useEffect(() => {
    async function fetchProducts() {
      // Wait for all data to load
      if (authLoading || orgLoading || subscription.loading) return

      if (!user) {
        router.push('/auth/login')
        return
      }

      if (!organization) {
        router.push('/onboarding')
        return
      }

      // Redirect if already has subscription
      if (subscription.hasAccess) {
        router.push('/dashboard')
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login')
          return
        }

        const productsResponse = await fetch('/api/stripe/products', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (productsResponse.ok) {
          const { products } = await productsResponse.json()
          setProducts(products)
        }
      } catch (error) {
        logger.error('Error fetching products', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [user, organization, authLoading, orgLoading, router, subscription])

  const handleStartCheckout = async (priceId: string) => {
    setLoadingPriceId(priceId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      logger.error('Error starting checkout', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoadingPriceId(null)
    }
  }

  if (authLoading || orgLoading || subscription.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !organization) {
    return null
  }

  // Redirect if already has subscription
  if (subscription.hasAccess) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Welcome to {organization.name}! Select a plan to get started with TintOps.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You can change or cancel your plan anytime.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {products.map((product, index) => {
              const price = product.prices[0]
              const displayInfo = getPricingDisplayInfo(price)
              const isPopular = index === 1 // Mark middle plan as popular

              return (
                <Card
                  key={product.id}
                  className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    {product.description && (
                      <CardDescription>{product.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <span className="text-4xl font-bold">{displayInfo.amount}</span>
                      <span className="text-muted-foreground text-lg">{displayInfo.interval}</span>
                    </div>

                    {displayInfo.trialDays && displayInfo.trialDays > 0 && (
                      <Badge variant="secondary" className="w-full justify-center py-2">
                        {displayInfo.trialDays}-day free trial included
                      </Badge>
                    )}

                    {/* Mock feature list for demo - replace with actual features */}
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        All core features
                      </li>
                      <li className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Email support
                      </li>
                      {index > 0 && (
                        <li className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Priority support
                        </li>
                      )}
                      {index > 1 && (
                        <li className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Advanced analytics
                        </li>
                      )}
                    </ul>

                    <Button
                      onClick={() => handleStartCheckout(price.id)}
                      disabled={loadingPriceId === price.id}
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      size="lg"
                    >
                      {loadingPriceId === price.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        displayInfo.trialDays && displayInfo.trialDays > 0
                          ? `Start ${displayInfo.trialDays}-Day Free Trial`
                          : 'Get Started'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>All plans include unlimited updates, SSL certificate, and 99.9% uptime guarantee.</p>
          <p className="mt-2">Questions? Contact us at support@tintops.app</p>
        </div>
      </div>
    </div>
  )
}