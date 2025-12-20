-- Fix Missing Profiles untuk task0@gmail.com
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat profile untuk semua users yang belum punya profile
INSERT INTO profiles (id, full_name)
SELECT 
  u.id, 
  CASE 
    WHEN u.email = 'task0@gmail.com' THEN 'task0'
    ELSE COALESCE(
      u.raw_user_meta_data->>'full_name', 
      split_part(u.email, '@', 1)
    )
  END as full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. Update profile untuk user task0@gmail.com jika sudah ada
UPDATE profiles 
SET full_name = 'task0'
WHERE id IN (
  SELECT u.id FROM auth.users u WHERE u.email = 'task0@gmail.com'
);

-- 3. Verifikasi hasil
SELECT 
  u.email,
  p.full_name
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'task0@gmail.com';