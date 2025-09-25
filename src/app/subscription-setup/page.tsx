import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { createServerClient } from '@/core/lib/supabase/server'
import { organizationService } from '@/core/lib/organizations'
import { getActiveProducts } from '@/core/lib/stripe-products'
import { getPricingDisplayInfo } from '@/core/lib/stripe-utils'
import { CheckoutButton } from '@/components/subscription/CheckoutButton'

export default async function SubscriptionSetupPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check authentication
  if (!user) {
    redirect('/auth/login')
  }

  // Check organization
  const { organization } = await organizationService.getOrganizationByUserId(user.id)
  if (!organization) {
    redirect('/onboarding')
  }

  // Check if already has subscription
  if (organization.is_active) {
    redirect('/dashboard')
  }

  // Fetch products
  const products = await getActiveProducts()

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

                  <CheckoutButton
                    priceId={price.id}
                    isPopular={isPopular}
                    trialDays={displayInfo.trialDays || undefined}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>All plans include unlimited updates, SSL certificate, and 99.9% uptime guarantee.</p>
          <p className="mt-2">Questions? Contact us at support@tintops.app</p>
        </div>
      </div>
    </div>
  )
}