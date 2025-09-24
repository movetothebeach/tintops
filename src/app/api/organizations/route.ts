import { NextRequest, NextResponse } from 'next/server'
import { organizationService } from '@/core/lib/organizations'
import { isReservedSubdomain, isValidSlug } from '@/core/utils/slug'
import { supabase } from '@/core/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subdomain, ownerName } = body

    // Get the authenticated user
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a Supabase client with the user's token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate input
    if (!name || !subdomain || !ownerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate subdomain format
    if (!isValidSlug(subdomain)) {
      return NextResponse.json({ error: 'Invalid subdomain format' }, { status: 400 })
    }

    // Check if subdomain is reserved
    if (isReservedSubdomain(subdomain)) {
      return NextResponse.json({ error: 'Subdomain is reserved and cannot be used' }, { status: 400 })
    }

    // Check subdomain availability
    const isAvailable = await organizationService.checkSubdomainAvailability(subdomain)
    if (!isAvailable) {
      return NextResponse.json({ error: 'Subdomain is not available' }, { status: 400 })
    }

    // Create organization
    const result = await organizationService.createOrganization({
      name,
      subdomain,
      ownerEmail: user.email!,
      ownerName,
      userId: user.id,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ organization: result.organization })
  } catch (error) {
    console.error('Error in organization creation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const result = await organizationService.getOrganizationByUserId(user.id)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ organization: result.organization })
  } catch (error) {
    console.error('Error in organization GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}