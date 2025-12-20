-- Debug Script untuk Created By Issue
-- Jalankan script ini di Supabase SQL Editor untuk debug

-- 1. Cek semua users di auth.users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- 2. Cek semua profiles
SELECT id, full_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;

-- 3. Cek tasks dan created_by
SELECT id, title, created_by, created_at FROM tasks ORDER BY created_at DESC LIMIT 10;

-- 4. Cek apakah ada profile untuk user task0@gmail.com
SELECT 
  u.id, 
  u.email, 
  p.full_name,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'task0@gmail.com';

-- 5. Cek tasks dengan join ke profiles
SELECT 
  t.id,
  t.title,
  t.created_by,
  u.email as creator_email,
  p.full_name as creator_name
FROM tasks t
LEFT JOIN auth.users u ON t.created_by = u.id
LEFT JOIN profiles p ON t.created_by = p.id
ORDER BY t.created_at DESC
LIMIT 10;