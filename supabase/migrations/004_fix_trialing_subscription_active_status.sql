-- Fix is_active status for existing trialing subscriptions
-- This addresses the issue where trialing subscriptions have is_active=false

-- Update organizations with trialing subscriptions to be active
UPDATE organizations
SET is_active = true
WHERE subscription_status = 'trialing'
  AND stripe_subscription_id IS NOT NULL
  AND is_active = false;

-- Also ensure active subscriptions are marked as active (safety check)
UPDATE organizations
SET is_active = true
WHERE subscription_status = 'active'
  AND stripe_subscription_id IS NOT NULL
  AND is_active = false;

-- Log the changes for audit
DO $$
DECLARE
    trialing_count integer;
    active_count integer;
BEGIN
    SELECT COUNT(*) INTO trialing_count
    FROM organizations
    WHERE subscription_status = 'trialing'
      AND stripe_subscription_id IS NOT NULL
      AND is_active = true;

    SELECT COUNT(*) INTO active_count
    FROM organizations
    WHERE subscription_status = 'active'
      AND stripe_subscription_id IS NOT NULL
      AND is_active = true;

    RAISE NOTICE 'Migration completed: % trialing subscriptions now active, % active subscriptions confirmed',
                 trialing_count, active_count;
END $$;