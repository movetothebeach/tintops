-- Update RLS policies for authentication and multi-tenancy
-- Replace the temporary "DENY ALL" policies with proper auth-based policies

-- Drop temporary deny policies
DROP POLICY IF EXISTS "Temporary Deny All - Organizations" ON organizations;
DROP POLICY IF EXISTS "Temporary Deny All - Users" ON users;
DROP POLICY IF EXISTS "Temporary Deny All - Customers" ON customers;
DROP POLICY IF EXISTS "Temporary Deny All - Communications" ON communications;
DROP POLICY IF EXISTS "Temporary Deny All - Automation Rules" ON automation_rules;

-- Organizations policies
-- Users can read their own organization
CREATE POLICY "Users can read own organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their own organization (for owners/admins)
CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Users policies
-- Users can read users in their organization
CREATE POLICY "Users can read organization users" ON users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (id = auth.uid());

-- Owners/admins can update users in their organization
CREATE POLICY "Admins can update organization users" ON users
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Customers policies
-- Users can read/write customers in their organization
CREATE POLICY "Users can read organization customers" ON customers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organization customers" ON customers
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization customers" ON customers
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization customers" ON customers
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Communications policies
-- Users can read/write communications in their organization
CREATE POLICY "Users can read organization communications" ON communications
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert organization communications" ON communications
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Automation rules policies
-- Users can read/write automation rules in their organization
CREATE POLICY "Users can read organization automation rules" ON automation_rules
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage automation rules" ON automation_rules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Note: We use subqueries in policies instead of a helper function
-- since we cannot create functions in the auth schema