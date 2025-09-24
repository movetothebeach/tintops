-- Remove fake subscription defaults and clean up existing data
-- This is CRITICAL: No organization should have subscription access without going through Stripe

-- First, remove the problematic defaults from the table
ALTER TABLE organizations
ALTER COLUMN subscription_status DROP DEFAULT,
ALTER COLUMN subscription_plan DROP DEFAULT,
ALTER COLUMN trial_ends_at DROP DEFAULT;

-- Set all existing organizations to NULL subscription data
-- (Since they got fake trial data, not real Stripe subscriptions)
UPDATE organizations
SET
  subscription_status = NULL,
  subscription_plan = NULL,
  trial_ends_at = NULL,
  current_period_end = NULL,
  stripe_customer_id = NULL,
  stripe_subscription_id = NULL
WHERE
  -- Only update orgs that have fake trial data but no real Stripe data
  subscription_status = 'trialing'
  AND stripe_subscription_id IS NULL;

-- Set is_active to false for organizations without real subscriptions
UPDATE organizations
SET is_active = false
WHERE
  subscription_status IS NULL
  OR (subscription_status NOT IN ('active', 'trialing') OR stripe_subscription_id IS NULL);