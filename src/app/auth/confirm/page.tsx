import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfirmPage({
  searchParams
}: {
  searchParams: { error?: string }
}) {
  const hasError = searchParams?.error === 'invalid_token'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{hasError ? 'Invalid or Expired Link' : 'Check your email'}</CardTitle>
            <CardDescription>
              {hasError
                ? 'The confirmation link is invalid or has expired. Please try signing up again.'
                : 'We\'ve sent you a confirmation link to complete your account setup.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {hasError
                  ? 'The email confirmation link you clicked is no longer valid. This can happen if the link has expired or has already been used.'
                  : 'Please check your email and click the confirmation link to activate your account. If you don\'t see the email, check your spam folder.'}
              </p>
              {!hasError && (
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}