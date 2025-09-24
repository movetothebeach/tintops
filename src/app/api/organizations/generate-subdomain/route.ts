import { NextRequest, NextResponse } from 'next/server'
import { organizationService } from '@/core/lib/organizations'
import { generateSlug, isValidSlug, isReservedSubdomain } from '@/core/utils/slug'
import { supabase } from '@/core/lib/supabase'
import { logger } from '@/core/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationName } = body

    // Get the authenticated user (optional for this endpoint)
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { error: authError } = await supabase.auth.getUser(token)

      if (authError) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
      }
    }

    // Validate input
    if (!organizationName || typeof organizationName !== 'string') {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    // Generate base slug
    const baseSlug = generateSlug(organizationName)

    if (!isValidSlug(baseSlug)) {
      return NextResponse.json({ error: 'Cannot generate valid subdomain from organization name' }, { status: 400 })
    }

    // Find available subdomain
    let subdomain = baseSlug
    let attempt = 1
    const maxAttempts = 100 // Prevent infinite loops

    while (attempt <= maxAttempts) {
      // Check if subdomain is reserved
      if (isReservedSubdomain(subdomain)) {
        // Try with suffix immediately
        attempt++
        subdomain = `${baseSlug}-${attempt}`
        continue
      }

      const isAvailable = await organizationService.checkSubdomainAvailability(subdomain)

      if (isAvailable) {
        return NextResponse.json({
          subdomain,
          generated: subdomain !== baseSlug // Indicates if we had to add a suffix
        })
      }

      // Try with suffix
      attempt++
      subdomain = `${baseSlug}-${attempt}`
    }

    // If we couldn't find an available subdomain after many attempts
    return NextResponse.json({
      error: 'Unable to generate available subdomain. Please try a different organization name.'
    }, { status: 409 })

  } catch (error) {
    logger.error('Error in generate subdomain API', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also provide a GET endpoint for simple checks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain parameter is required' }, { status: 400 })
    }

    const isAvailable = await organizationService.checkSubdomainAvailability(subdomain)

    return NextResponse.json({
      subdomain,
      available: isAvailable && !isReservedSubdomain(subdomain),
      valid: isValidSlug(subdomain),
      reserved: isReservedSubdomain(subdomain)
    })

  } catch (error) {
    logger.error('Error in subdomain check API', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}