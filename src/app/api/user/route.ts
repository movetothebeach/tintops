import { NextResponse } from 'next/server'
import { createServerClient } from '@/core/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        createdAt: user.created_at,
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}