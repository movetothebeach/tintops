import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Stripe configuration
export const STRIPE_CONFIG = {
  // Products and prices (to be set when Stripe account is configured)
  PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY || '',
  PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY || '',

  // Free trial period
  TRIAL_PERIOD_DAYS: 14,

  // Webhook secret
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Success and cancel URLs
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,

  // Customer portal return URL
  PORTAL_RETURN_URL: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
} as const

// Stripe client-side utilities
export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  }
  return key
}