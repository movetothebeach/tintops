-- Add essential subscription fields for proper plan tracking and billing management
-- These fields are critical for customer support, analytics, and grandfathering pricing

-- Add Stripe price ID to track exact pricing plan
ALTER TABLE organizations
ADD COLUMN stripe_price_id TEXT;

COMMENT ON COLUMN organizations.stripe_price_id IS 'Stripe Price ID (price_xxx) - identifies exact pricing plan including amount and interval';

-- Add Stripe product ID to track which product tier
ALTER TABLE organizations
ADD COLUMN stripe_product_id TEXT;

COMMENT ON COLUMN organizations.stripe_product_id IS 'Stripe Product ID (prod_xxx) - identifies the product/tier (Basic, Pro, etc)';

-- Add subscription amount in cents for quick reference
ALTER TABLE organizations
ADD COLUMN subscription_amount INTEGER;

COMMENT ON COLUMN organizations.subscription_amount IS 'Subscription amount in cents (e.g., 9700 for $97.00) - cached for performance';

-- Create index for analytics queries
CREATE INDEX idx_organizations_stripe_price ON organizations(stripe_price_id);
CREATE INDEX idx_organizations_stripe_product ON organizations(stripe_product_id);