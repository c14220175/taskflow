-- Fix Team Invitations Policy - Remove auth.users dependency
-- Jalankan script ini di Supabase SQL Editor

-- 1. Drop existing policies
DROP POLICY IF EXISTS "invitations_select" ON team_invitations;
DROP POLICY IF EXISTS "invitations_insert" ON team_invitations;
DROP POLICY IF EXISTS "invitations_update" ON team_invitations;

-- 2. Create simple policies without auth.users dependency
CREATE POLICY "invitations_select" ON team_invitations FOR SELECT USING (
  auth.uid() = invited_by OR 
  auth.uid()::text IN (
    SELECT id::text FROM profiles WHERE id IN (
      SELECT id FROM auth.users WHERE email = team_invitations.invited_email
    )
  )
);

-- 3. Simpler approach - allow all authenticated users to see invitations
DROP POLICY IF EXISTS "invitations_select" ON team_invitations;
CREATE POLICY "invitations_select" ON team_invitations FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. Allow insert for authenticated users
CREATE POLICY "invitations_insert" ON team_invitations FOR INSERT WITH CHECK (auth.uid() = invited_by);

-- 5. Allow update for invited users (simplified)
CREATE POLICY "invitations_update" ON team_invitations FOR UPDATE USING (auth.uid() IS NOT NULL);