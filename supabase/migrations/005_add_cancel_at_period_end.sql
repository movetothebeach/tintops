-- Add cancel_at_period_end field to track subscription cancellation state
-- This allows us to show users when their subscription will end and offer reactivation

ALTER TABLE organizations
ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;

COMMENT ON COLUMN organizations.cancel_at_period_end IS 'True when subscription is canceled but still active until period ends';