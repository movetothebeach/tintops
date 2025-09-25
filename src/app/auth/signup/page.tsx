import Link from 'next/link'
import { SignUpForm } from '@/features/auth/components/SignUpForm'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your TintOps account and get started
          </p>
        </div>
        <SignUpForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}