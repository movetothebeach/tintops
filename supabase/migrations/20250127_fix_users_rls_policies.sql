-- Fix RLS policies for users table to eliminate circular dependency
-- The current policy prevents users from reading their own record

-- Add policy to allow users to read their own record FIRST
-- This is critical for the middleware to check organization membership
CREATE POLICY "Users can read own record" ON users
  FOR SELECT USING (id = auth.uid());

-- Now let's also add an INSERT policy for new user creation
-- This allows the initial user record to be created when someone signs up
CREATE POLICY "Users can insert own record on signup" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Add a policy for service operations (for completeness)
-- This ensures the service role can still perform necessary operations
-- Note: Service role with service key already bypasses RLS, but this documents intent
COMMENT ON TABLE users IS 'User records linked to auth.users. Users can read their own record and records of users in their organization.';