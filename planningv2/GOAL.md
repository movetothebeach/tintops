# TintOps Development Goals

## Core Goals

### 1. Server-Side Rendering When Beneficial
Prefer SSR for:
- Initial page loads
- SEO-important content
- Data fetching and auth checks
- Eliminating loading states

Keep client-side for:
- Interactive UI elements
- Real-time updates
- Form handling with validation feedback
- Animations and transitions

### 2. Production-Ready From Day One
- No MVPs or "we'll fix it later" code
- No workarounds or temporary solutions
- Consider scale, security, and reliability in every decision
- Build for real users with real business needs

### 3. Leverage Platform Capabilities Fully
- Let Supabase handle auth, don't reinvent
- Let Stripe own payments completely
- Use Next.js SSR capabilities
- Trust Vercel's edge network
- Use platform features before building custom

## Important Technical Context

### Authentication Architecture
- **Supabase SSR** with cookie-based authentication
- **Never use Bearer tokens** - cookies only
- **Middleware** handles auth at request level
- **CSRF protection** with double-submit cookies
- Auth checks happen server-side before render

### Data Architecture
- **Row Level Security (RLS)** for multi-tenant isolation
- **Server-side data fetching** by default
- **No client-side organization fetching** - it's in the layout
- Database queries happen in Server Components or Actions

### Application Architecture
- **Next.js 15 App Router** is the foundation
- **Server Components by default** - client only when needed
- **Server Actions** preferred over API routes for mutations
- **TypeScript** everywhere with strict mode
- **Zod** for runtime validation
- **Environment variables** validated on startup

### Third-Party Services
- **Stripe** owns all payment/subscription logic
- **Webhooks** are the source of truth for subscription state
- **No custom billing code** - use Stripe's portal
- **Supabase** handles all auth flows

### Performance Targets
- No loading spinners on navigation
- Instant page transitions via SSR
- Minimal client-side JavaScript
- Optimistic updates where appropriate
- Error boundaries for resilience

## What Success Looks Like

A codebase where:
- New developers understand the architecture immediately
- Features work correctly under concurrent load
- Errors are handled gracefully
- Performance is consistently fast
- Security is never compromised for convenience
- The user experience feels premium

## What to Avoid

- Mock data in production code
- Client-side auth checks as primary protection
- Bearer tokens anywhere
- Race conditions from non-atomic operations
- Loading spinners that could be eliminated with SSR
- Duplicate data fetching
- "Temporary" fixes that become permanent

## Decision Framework

When making architectural decisions, ask:
1. Can the platform handle this for us?
2. Will this work correctly with 1000 concurrent users?
3. Does this eliminate or add loading states?
4. Is this the simplest secure solution?
5. Will future developers understand this?

Remember: Boring, predictable, production-ready code wins.