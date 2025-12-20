-- Setup Database untuk TaskFlow dengan User Isolation

-- 1. Buat tabel profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 4. Buat tabel tasks dengan team support
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'To Do',
  category TEXT DEFAULT 'Personal',
  priority TEXT DEFAULT 'Medium',
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

-- 7. Policies untuk profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 8. Policies untuk teams
CREATE POLICY "teams_select" ON teams FOR SELECT USING (
  auth.uid() = created_by OR 
  auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = teams.id)
);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (auth.uid() = created_by);

-- 9. Policies untuk team_members
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT created_by FROM teams WHERE id = team_id)
);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT created_by FROM teams WHERE id = team_id)
);
CREATE POLICY "team_members_delete" ON team_members FOR DELETE USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT created_by FROM teams WHERE id = team_id)
);

-- 10. Policies untuk tasks (USER ISOLATION)
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (
  -- User dapat melihat task yang mereka buat
  auth.uid() = created_by OR 
  -- User dapat melihat task yang ditugaskan kepada mereka
  auth.uid() = assigned_to OR 
  -- User dapat melihat task tim jika mereka anggota tim tersebut
  (team_id IS NOT NULL AND auth.uid() IN (
    SELECT user_id FROM team_members WHERE team_id = tasks.team_id
  ))
);

CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  -- Jika task untuk tim, user harus anggota tim tersebut
  (team_id IS NULL OR auth.uid() IN (
    SELECT user_id FROM team_members WHERE team_id = tasks.team_id
  ))
);

CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR
  (team_id IS NOT NULL AND auth.uid() IN (
    SELECT user_id FROM team_members WHERE team_id = tasks.team_id
  ))
);

CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (
  auth.uid() = created_by
);

-- 6. Function untuk auto-create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger untuk auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();