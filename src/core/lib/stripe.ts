import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Helper function to validate and get environment variable
const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    throw new Error(`${key} environment variable is required but not set`)
  }
  return value
}

// Stripe configuration with lazy validation
export const STRIPE_CONFIG = {
  // Webhook secret - validated when accessed
  get WEBHOOK_SECRET(): string {
    return getRequiredEnvVar('STRIPE_WEBHOOK_SECRET')
  },

  // URLs - validated when accessed
  get SUCCESS_URL(): string {
    return `${getRequiredEnvVar('NEXT_PUBLIC_APP_URL')}/billing/success`
  },
  get CANCEL_URL(): string {
    return `${getRequiredEnvVar('NEXT_PUBLIC_APP_URL')}/billing/canceled`
  },
  get PORTAL_RETURN_URL(): string {
    return `${getRequiredEnvVar('NEXT_PUBLIC_APP_URL')}/billing`
  },
} as const

// Stripe client-side utilities
export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  return key
}