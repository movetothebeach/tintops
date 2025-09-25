import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/core/lib/supabase/server'
import { logger } from '@/core/lib/logger'
import { z } from 'zod'

const checkEmailSchema = z.object({
  email: z.string().email('Invalid email format')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = checkEmailSchema.parse(body)

    const adminClient = await createServiceClient()

    // Check if user already exists with this email
    const { data, error } = await adminClient.auth.admin.listUsers()

    if (error) {
      logger.error('Error checking user email', error)
      return NextResponse.json({ error: 'Unable to verify email' }, { status: 500 })
    }

    // Check if email exists in the users list
    const emailExists = data.users.some(user => user.email === email)

    return NextResponse.json({
      emailExists,
      message: emailExists
        ? 'An account with this email already exists. Please sign in instead.'
        : 'Email is available'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }

    logger.error('Error in check-email endpoint', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}