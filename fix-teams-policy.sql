-- Fix Teams Policy - Simple Version (No Recursion)
-- Jalankan script ini di Supabase SQL Editor

-- 1. Drop existing policies
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "team_members_select" ON team_members;

-- 2. Simple policy untuk teams - hanya creator yang bisa lihat
CREATE POLICY "teams_select" ON teams FOR SELECT USING (auth.uid() = created_by);

-- 3. Simple policy untuk team_members - hanya member yang bisa lihat membership mereka
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (auth.uid() = user_id);