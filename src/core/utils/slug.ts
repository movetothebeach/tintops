/**
 * Reserved subdomains that cannot be used by organizations
 * Comprehensive list covering infrastructure, business, and security needs
 */
const RESERVED_SUBDOMAINS = [
  // Core infrastructure
  'api', 'www', 'admin', 'dashboard', 'app', 'console',

  // Technical/CDN
  'cdn', 'static', 'assets', 'media', 'images', 'files', 'downloads',

  // Communication
  'mail', 'email', 'smtp', 'pop', 'imap', 'support', 'help', 'contact',

  // Authentication & Security
  'auth', 'login', 'signup', 'oauth', 'sso', 'security', 'abuse', 'report',

  // Business/Legal
  'blog', 'docs', 'documentation', 'status', 'about', 'legal', 'privacy',
  'terms', 'billing', 'payments', 'invoice', 'sales', 'marketing',

  // Development
  'dev', 'development', 'staging', 'test', 'testing', 'demo', 'preview',

  // Networking/Services
  'ftp', 'ssh', 'vpn', 'proxy', 'gateway',

  // Common business terms (prevent conflicts)
  'tintops', 'tint-ops', 'shop', 'store', 'account', 'user', 'client',
  'customer', 'service', 'portal', 'platform'
]

/**
 * Generates a URL-friendly slug from organization name
 * Follows the subdomain validation rules: lowercase letters, numbers, hyphens only
 * Must start and end with alphanumeric characters
 */
export function generateSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    return 'tint-shop'
  }

  let slug = input
    .trim()
    .toLowerCase()
    // Remove accents and special characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all characters except letters, numbers, and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')

  // Ensure minimum length and valid start/end
  if (slug.length < 3) {
    return 'tint-shop'
  }

  // Ensure starts with alphanumeric
  if (!/^[a-z0-9]/.test(slug)) {
    slug = 'shop-' + slug
  }

  // Ensure ends with alphanumeric
  if (!/[a-z0-9]$/.test(slug)) {
    slug = slug + '-shop'
  }

  // Truncate if too long (keeping reasonable length)
  if (slug.length > 30) {
    slug = slug.substring(0, 30).replace(/-+$/, '')
  }

  // If the generated slug is reserved, add suffix
  if (isReservedSubdomain(slug)) {
    slug = slug + '-shop'
  }

  return slug
}

/**
 * Checks if a subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
}

/**
 * Validates if a slug meets the subdomain requirements
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3) return false

  // Must match the pattern: lowercase letters, numbers, hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) return false

  // Must start with letter or number
  if (!/^[a-z0-9]/.test(slug)) return false

  // Must end with letter or number
  if (!/[a-z0-9]$/.test(slug)) return false

  // Must not be reserved
  if (isReservedSubdomain(slug)) return false

  return true
}