import { z } from 'zod'

const envSchema = z.object({
  // Public environment variables (available in browser)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Server-only environment variables
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(), // Optional for client-side builds
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_PRICE_MONTHLY: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_YEARLY: z.string().startsWith('price_').optional(),

  // Optional services
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

class EnvValidator {
  private env: Env | null = null
  private validated = false

  validate(): Env {
    if (this.validated && this.env) {
      return this.env
    }

    try {
      const parsed = envSchema.parse({
        // Public vars
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

        // Server vars (only validate on server)
        ...(typeof window === 'undefined' ? {
          SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
          STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
          STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
          STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
          STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
          INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
          INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
          TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
          TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
          RESEND_API_KEY: process.env.RESEND_API_KEY,
        } : {}),
      })

      this.env = parsed
      this.validated = true
      return parsed
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missing = error.issues
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join('\n')

        throw new Error(
          `Environment validation failed:\n${missing}\n\n` +
          `Please check your .env.local file and ensure all required variables are set.`
        )
      }
      throw error
    }
  }

  get(): Env {
    if (!this.validated) {
      return this.validate()
    }
    return this.env!
  }
}

// Singleton instance
const envValidator = new EnvValidator()

// Validate on module load (will throw if invalid)
if (typeof window === 'undefined') {
  // Only validate on server to avoid client-side errors
  envValidator.validate()
}

export const env = envValidator.get.bind(envValidator)
export const validateEnv = envValidator.validate.bind(envValidator)