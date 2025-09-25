TintOps - Project Context for Claude
What We're Building
A SaaS platform for window tinting shops that automates their marketing and operations.
Main competitor: TintWiz (look them up if needed).
Our advantage: Automated SMS marketing and call tracking.

UI/UX Overview USE SHADCN UI
What This Is
A modern CRM for automotive tint shops that organizes by intent (what you're trying to do) rather than by data type (contacts, projects, etc.). Navigation matches your actual workflow, not database structure.
Design System
Clean, minimal interface inspired by Vercel/Linear. Monochrome base with strategic use of color and icons for utility - red for urgent items, amber for warnings, green for success states. Icons used sparingly to improve scannability. Left sidebar navigation with each section opening a full dashboard view, not dropdowns.
Navigation Structure
Overview
Daily snapshot dashboard displaying revenue metrics, today's schedule, key performance indicators, and action items
Needs Attention
Action dashboard with items organized into priority sections (critical → important → maintenance)
Leads
Pipeline tracking from inquiry → quote → follow-up → closed, with aging indicators. Includes pipeline marketing automations that can be initiated directly from lead records. Automation settings managed in Settings page.
Schedule
Calendar view with availability checker, job assignments, drag-to-reschedule
Billing
Today's completed jobs, outstanding invoices, payment processing, revenue tracking
Customers
Full database with communication history, lifetime value, job records
Settings
Automated sequences, templates, business hours, integrations

Core Innovation: Same data appears in multiple places based on context. A customer shows up in Leads (as opportunity), Schedule (as appointment), Billing (as invoice), all organized by what you're doing, not what they are.

Business Model
Tint shops sign up for TintOps
They pay us monthly via Stripe
Each shop gets their own isolated account (multi-tenant)
We automate their customer communications
Core Architecture Decisions
Framework: Next.js 14 (App Router) + TypeScript
Styling: Tailwind CSS
Hosting: Vercel
Database: Supabase (PostgreSQL)
Payments: Stripe (for our SaaS billing)
Background Jobs: Inngest
Version Control: Git + GitHub
SMS/Calls: Twilio (for tint shops to message their customers)
Email: Resend (transactional emails)
Multi-Tenant Architecture
Each tint shop is an "Organization"
Organizations have complete data isolation via RLS
Each org can have multiple users (shop employees)
Each org manages their own customers
Key Business Rules
Each tint shop is a separate "Organization" (multi-tenant)
SMS consent: Web form submission = consent(subject to change) (with disclosure)
All automations are OFF by default (must be explicitly enabled)
Stripe handles our billing (tint shops pay us)
Organizations must have active subscription to use features
Current Code Patterns
Use /src directory structure
Features are isolated in /src/features/[feature-name]
Shared logic goes in /src/core
JSON fields for flexible settings (not rigid columns)
Always add safety checks for automations
RLS policies on every table
Git Commit Message Format
Always use these prefixes for commits:

feat: for new features
fix: for bug fixes
setup: for configuration
docs: for documentation
chore: for maintenance tasks
refactor: for code refactoring
What NOT to Do
Don't send SMS without checking consent(consent may be implied)
Don't create automations that run immediately(subject to change) (always add delays)
Don't use Vercel cron (use Inngest instead)
Don't hardcode organization-specific settings
Don't allow cross-organization data access
Don't process payments without webhook verification