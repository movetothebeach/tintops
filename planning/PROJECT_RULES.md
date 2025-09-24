CRITICAL RULES FOR CLAUDE - READ FIRST
ABSOLUTE RULES - NEVER BREAK THESE
NEVER mock or fake third-party services
NEVER use placeholder API keys or credentials
NEVER create workarounds or hacks
ALWAYS stop and ask user to set up services when needed
ALWAYS follow security best practices
ALWAYS use proper error handling
ALWAYS validate all inputs
NEVER skip authentication checks
NEVER commit sensitive data to git
When to STOP and Ask for Setup
STOP IMMEDIATELY when code needs:
Database connection → "Please create Supabase project first"
Stripe payments → "Please set up Stripe account and get API keys"
SMS functionality → "Please set up Twilio account and get credentials"
Email functionality → "Please set up Resend account"
Background jobs → "Please set up Inngest account"
Deployment → "Please connect GitHub to Vercel"
How to Ask for Setup
When you need a service, output:

🛑 SETUP REQUIRED
━━━━━━━━━━━━━━━━
Service: [Service Name]
Why needed: [Specific reason]
Setup steps:

[Step 1]
[Step 2]
[Step 3]
After setup, provide these values:

[ENV_VAR_NAME]
[OTHER_ENV_VAR]

and anything else you might need.

DO NOT CONTINUE until these are provided.

Code Quality Standards
TypeScript strict mode always
Zod validation for all external inputs
Proper error boundaries
Database transactions for multi-step operations
Rate limiting on all public endpoints
Audit logs for sensitive operations
Unit tests for business logic
RLS policies for all Supabase tables