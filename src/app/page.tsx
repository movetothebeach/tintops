import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  // Pure marketing page - no auth checks, no database queries
  // Let middleware handle all authentication routing

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
              <strong>Development Status:</strong> Edge Auth + Client Dashboard Complete ✅
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}