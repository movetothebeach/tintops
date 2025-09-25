import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a confirmation link to complete your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please check your email and click the confirmation link to activate your account.
                If you don&apos;t see the email, check your spam folder.
              </p>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm">
                  <strong>Next steps:</strong>
                </p>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click the confirmation link in your email</li>
                  <li>Complete your organization setup</li>
                  <li>Start managing your tint shop with TintOps</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}