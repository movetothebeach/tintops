-- Initial schema for TintOps
-- Run this after creating Supabase project

-- Organizations table (tint shops that pay us)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,

  -- Stripe subscription info
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trialing',
  subscription_plan TEXT DEFAULT 'monthly',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_end TIMESTAMPTZ,

  -- Settings and features
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,

  -- Twilio subaccount (created during onboarding)
  twilio_subaccount_sid TEXT,
  twilio_phone_number TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (employees of tint shops)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table (tint shop's customers)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contact info
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,

  -- Lead tracking
  source TEXT CHECK (source IN ('website', 'call', 'walkin', 'referral')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost', 'ghost')),

  -- Automation control
  automation_enabled BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',

  -- SMS Consent
  sms_consent BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  consent_method TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  last_contact_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure phone numbers are unique per organization
  UNIQUE(organization_id, phone)
);

-- Communications log (for compliance and history)
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  type TEXT CHECK (type IN ('sms', 'call', 'email')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  status TEXT,

  -- For tracking automation
  automation_rule_id UUID,

  -- Costs and metadata
  cost DECIMAL(10,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,

  -- Trigger conditions (JSON for flexibility)
  triggers JSONB NOT NULL,

  -- Actions to take (JSON for flexibility)
  actions JSONB NOT NULL,

  -- Safety limits
  max_sends_per_day INTEGER DEFAULT 100,
  max_sends_per_customer INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_communications_customer ON communications(customer_id);
CREATE INDEX idx_communications_org ON communications(organization_id);
CREATE INDEX idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);

-- Row Level Security (CRITICAL for multi-tenant)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (temporary - will update after auth setup)
-- These prevent any access until we set up proper auth
CREATE POLICY "Temporary Deny All - Organizations" ON organizations FOR ALL USING (false);
CREATE POLICY "Temporary Deny All - Users" ON users FOR ALL USING (false);
CREATE POLICY "Temporary Deny All - Customers" ON customers FOR ALL USING (false);
CREATE POLICY "Temporary Deny All - Communications" ON communications FOR ALL USING (false);
CREATE POLICY "Temporary Deny All - Automation Rules" ON automation_rules FOR ALL USING (false);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();