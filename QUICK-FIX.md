# Quick Fix: Signup Error

## Langkah 1: Setup Database (WAJIB!)

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste script ini:

```sql
-- Setup Database Minimal untuk TaskFlow

-- 1. Buat tabel profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat tabel tasks
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. Simple policies untuk profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Simple policies untuk tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (auth.uid() = created_by);

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
```

6. Klik **Run** atau tekan `Ctrl+Enter`

## Langkah 2: Nonaktifkan Email Confirmation (Development)

1. Di Supabase Dashboard, klik **Authentication** > **Settings**
2. Scroll ke bagian **Email Auth**
3. **MATIKAN** toggle "Enable email confirmations"
4. Klik **Save**

## Langkah 3: Test Signup

1. Restart development server:
   ```bash
   npm run dev
   ```

2. Buka http://localhost:3000/signup

3. Test dengan:
   - Email: `test@example.com`
   - Password: `test123` (minimal 6 karakter)

4. Jika berhasil, akan redirect ke login dengan pesan sukses

## Jika Masih Error:

### Cek Console Browser:
- Tekan F12
- Lihat tab Console
- Screenshot error yang muncul

### Cek Terminal:
- Lihat terminal tempat `npm run dev` berjalan
- Cari pesan error dengan prefix "Signup error:"

### Cek Environment Variables:
File `.env.local` harus berisi:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Dapatkan dari: Supabase Dashboard > Settings > API

## Masalah Umum:

❌ **"Email sudah terdaftar"**
→ Gunakan email lain atau hapus user di Authentication > Users

❌ **"Password minimal 6 karakter"**
→ Gunakan password minimal 6 karakter

❌ **Tidak ada error tapi tidak redirect**
→ Cek apakah SQL script sudah dijalankan

❌ **"Database error"**
→ Pastikan tabel profiles dan trigger sudah dibuat
