# Development Philosophy

## Core Principles

### Security First
Every feature must be secure by default:
- Authentication checks happen server-side
- Never trust client-side validation alone
- Use platform security features (RLS, CSRF tokens)
- Validate all inputs with Zod schemas
- Sanitize outputs appropriately
- No secrets in client code

### Consider Concurrent Access
Your code will have multiple users at once:
- Design for concurrent operations
- Use atomic database operations
- Avoid race conditions with proper locking
- Test with multiple simultaneous users
- Consider what happens when two users edit simultaneously

### Atomic Operations for Shared State
Critical operations must be all-or-nothing:
- Use database transactions for related changes
- Ensure organization + user creation is atomic
- Subscription updates must be consistent
- No partial state updates
- Roll back on any failure

### Error Boundaries for Production
Things will go wrong - handle it gracefully:
- Wrap components in error boundaries
- Provide meaningful error messages
- Log errors appropriately for debugging
- Never show stack traces to users
- Always have a recovery path
- Fail gracefully with fallback UI

### No Mock Data in Production
Production code is for production:
- No fake data generators
- No test users or demo accounts in prod
- Real data or nothing
- Use proper test environments for testing
- If you need sample data, document it separately

### Performance Matters
User experience is paramount:
- Eliminate unnecessary loading states with SSR
- Optimize database queries
- Use proper caching strategies
- Minimize client bundle size
- Lazy load when appropriate

## Technical Standards

### Code Quality
- TypeScript strict mode always
- Explicit types over `any`
- Handle all error cases
- Write self-documenting code
- Keep functions focused and small

### Testing Mindset
- Think about edge cases
- Consider failure modes
- Verify functionality with slow connections
- Verify with multiple browsers
- Check mobile experience

### Maintenance Thinking
- Will someone understand this in 6 months?
- Are the dependencies well-maintained?
- Is this pattern used consistently?
- Can this be easily modified?
- Is the intention clear?

## Decision Making

### When Adding Features
Ask yourself:
1. Is this solving a real user problem?
2. Will this work at scale?
3. What happens when this fails?
4. Is there a simpler solution?
5. Does this follow existing patterns?

### When Fixing Bugs
Consider:
1. What is the root cause?
2. Will this fix break anything else?
3. Should this be fixed at a different layer?
4. Is there a systemic issue to address?
5. How do we prevent this in the future?

### When Refactoring
Ensure:
1. Tests still pass
2. Performance isn't degraded
3. The API remains stable
4. Error handling is preserved
5. The code is actually clearer

## Cultural Values

### Collaboration
- Write code others can understand
- Leave the codebase better than you found it
- Share context in commits and PRs
- Ask for help when stuck
- Review thoughtfully

## The Golden Rule

**Build software you'd be proud to maintain and happy to use.**

Every decision should move toward a system that is:
- Reliable for users
- Secure by design
- Pleasant to work with
- Economical to operate
- Ready for growth

Remember: We're building a real business tool that real people depend on. Act accordingly.