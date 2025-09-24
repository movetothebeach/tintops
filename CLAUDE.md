# Claude Code Assistant Context

## 🏗️ System Context
This is **TintOps**, a production SaaS application serving real users with real business needs. Quality, security, and reliability matter.

## 🛠️ Architecture Landscape

### Service Ecosystem
- **Supabase**: Owns authentication, database operations, Row Level Security (RLS), user sessions
- **Stripe**: Owns payments, subscriptions, compliance, billing, webhooks
- **Next.js 15**: App Router, SSR, API routes, full-stack framework
- **Vercel**: Hosting, deployment, environment management, edge functions
- **TypeScript**: Compile-time validation, developer experience, type safety

### Investigation Starting Points
When encountering what appears to be missing functionality, investigate:
- What does each service already handle in their domain?
- How does the existing codebase solve similar problems?
- What patterns emerge from reading the current implementation?
- Are there established conventions being followed?

## 🤔 Thinking Frameworks

### Problem Analysis Approach
Before implementing solutions:
- **Understand the full context** - What's the real problem being solved?
- **Map service boundaries** - Which service owns this concern?
- **Study existing implementations** - How does this codebase handle similar cases?
- **Consider implications** - What could go wrong? How does this scale?
- **Evaluate trade-offs** - What are the costs and benefits of different approaches?

### Code Quality Lens
When evaluating any solution, consider:
- **Type safety** - How does TypeScript help catch issues early?
- **Error boundaries** - What happens when things fail?
- **Concurrency** - How does this behave under load or with multiple users?
- **Maintainability** - Can future developers understand and modify this?
- **Security** - Are there any trust boundaries being crossed?

### Decision Making Process
For any implementation choice:
1. **Investigate existing solutions** in this codebase
2. **Research service capabilities** that might already solve this
3. **Consider the failure modes** and edge cases
4. **Think through concurrent usage** scenarios
5. **Evaluate long-term implications** for the system

## ⛔ Universal No-Go Zone
Some things are always wrong in production software:

### NEVER CREATE MOCK DATA

### Security Compromises
Never acceptable: Exposing secrets, skipping authentication checks, trusting user input without validation, implementing custom crypto/auth when services exist.

### Race Conditions
Never acceptable: Non-atomic operations on shared state, assuming sequential execution, ignoring concurrency in stateful operations.

### Production Hacks
Never acceptable: Temporary fixes that stay permanent, bypassing proper error handling, hardcoding environment-specific values, suppressing errors without handling.

### Code Quality Violations
Never acceptable: Silently failing operations, assuming external services always work, leaving debugging code in production.

## 🔍 Investigation Patterns

### When You See Potential Issues
- **Before assuming something is missing**: Check if a service already handles it
- **Before implementing security**: Verify what RLS policies or service-level protections exist
- **Before adding error handling**: Look at how similar operations handle failures
- **Before optimizing**: Understand the current performance characteristics

### When Reading Existing Code
- **Look for conventions** in naming, structure, error handling
- **Understand service integration patterns** being used
- **Notice how concurrency is handled** in similar operations
- **See how configuration and environment are managed**

### When Designing Solutions
- **Think about state mutations** and whether they need to be atomic
- **Consider error scenarios** and recovery strategies
- **Plan for concurrent access** from multiple users/processes
- **Design for observability** and debugging

## 🎯 Success Indicators

You're on the right track when:
- Solutions feel consistent with the existing codebase
- Error handling is comprehensive but not overwhelming
- The approach leverages existing services appropriately
- Code is self-documenting through good types and naming
- Concurrent usage scenarios have been considered
- Failure modes have been planned for

## 💭 Mental Models

### This Codebase Values
- **Reliability over cleverness** - Boring, predictable code that works
- **Service integration over custom implementation** - Use what exists
- **Explicit over implicit** - Clear types, clear error messages, clear intent
- **Production-ready from the start** - Not "we'll fix it later"

### Think In Terms Of
- **Service responsibilities** rather than feature boundaries
- **User experience** under both success and failure conditions
- **System behavior** under concurrent load
- **Developer experience** for future maintainers
- **Production debugging** when things inevitably break

## 🎪 When Uncertain
Ask about service responsibilities, investigate existing patterns, consider the production implications, think through failure scenarios, and choose the path that serves users reliably.

The goal is software that works correctly, fails gracefully, and can be maintained by a team over time.

## Read all MD files under /planning