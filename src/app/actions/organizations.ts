'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/core/lib/supabase/server'
import { organizationService } from '@/core/lib/organizations'
import { isReservedSubdomain, isValidSlug } from '@/core/utils/slug'
import { revalidatePath } from 'next/cache'

export async function createOrganization(formData: FormData) {
  const name = formData.get('name') as string
  const subdomain = formData.get('subdomain') as string
  const ownerName = formData.get('ownerName') as string

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate input
  if (!name || !subdomain || !ownerName) {
    throw new Error('Missing required fields')
  }

  // Validate subdomain format
  if (!isValidSlug(subdomain)) {
    throw new Error('Invalid subdomain format')
  }

  // Check if subdomain is reserved
  if (isReservedSubdomain(subdomain)) {
    throw new Error('Subdomain is reserved and cannot be used')
  }

  // Check subdomain availability
  const isAvailable = await organizationService.checkSubdomainAvailability(subdomain)
  if (!isAvailable) {
    throw new Error('Subdomain is not available')
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
    throw new Error(result.error)
  }

  // Revalidate the cache for organization data
  revalidatePath('/dashboard')
  revalidatePath('/billing')

  // Redirect to subscription setup
  redirect('/subscription-setup')
}

export async function generateSubdomain(organizationName: string) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!organizationName || organizationName.length < 2) {
    throw new Error('Organization name too short')
  }

  // Generate slug from organization name
  let baseSlug = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)

  // Ensure slug starts and ends with alphanumeric
  baseSlug = baseSlug.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')

  if (baseSlug.length < 3) {
    baseSlug = 'shop'
  }

  // Check availability and add number if needed
  let slug = baseSlug
  let counter = 1
  let isAvailable = false

  while (!isAvailable && counter < 100) {
    isAvailable = await organizationService.checkSubdomainAvailability(slug)
    if (!isAvailable) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  return slug
}