-- Create Missing Teams Tables (Fixed Policies)
-- Jalankan script ini di Supabase SQL Editor

-- 1. Drop existing policies if any
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "teams_insert" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- 2. Buat tabel teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat tabel team_members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 4. Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 5. Simple policies untuk teams (allow read for all authenticated users)
CREATE POLICY "teams_select" ON teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (auth.uid() = created_by);

-- 6. Simple policies untuk team_members (no recursion)
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (true); -- Allow anyone to join
CREATE POLICY "team_members_delete" ON team_members FOR DELETE USING (auth.uid() = user_id);