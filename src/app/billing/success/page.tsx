import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function BillingSuccessPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>Welcome to TintOps!</CardTitle>
            <CardDescription>
              Your subscription has been activated successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <h3 className="font-medium text-green-800 mb-2">What&apos;s Next?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Your 14-day free trial has started</li>
                <li>• Access all premium features immediately</li>
                <li>• Set up your team and customers</li>
                <li>• Configure your SMS automations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/billing">
                  View Billing
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}