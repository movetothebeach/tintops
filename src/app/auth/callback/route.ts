import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/core/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/onboarding'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // Redirect to an error page
  redirectTo.pathname = '/auth/confirm'
  redirectTo.searchParams.delete('next')
  redirectTo.searchParams.set('error', 'invalid_token')
  return NextResponse.redirect(redirectTo)
}