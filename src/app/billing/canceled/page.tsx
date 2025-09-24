import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'

export default function BillingCanceledPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-orange-500" />
            </div>
            <CardTitle>Subscription Canceled</CardTitle>
            <CardDescription>
              No worries! You can subscribe anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
              <h3 className="font-medium text-orange-800 mb-2">What Happened?</h3>
              <p className="text-sm text-orange-700">
                Your subscription setup was canceled. Your organization is still created,
                but you&apos;ll need to complete billing to start your free trial and access TintOps features.
              </p>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/billing">
                  Complete Billing
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}