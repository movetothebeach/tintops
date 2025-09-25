import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your TintOps account
          </p>
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}