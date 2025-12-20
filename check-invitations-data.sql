-- Cek Data Invitations
-- Jalankan script ini di Supabase SQL Editor

-- 1. Cek semua invitations yang ada
SELECT 
  ti.id,
  ti.invited_email,
  ti.status,
  ti.created_at,
  t.name as team_name,
  u.email as inviter_email
FROM team_invitations ti
LEFT JOIN teams t ON ti.team_id = t.id
LEFT JOIN auth.users u ON ti.invited_by = u.id
ORDER BY ti.created_at DESC;

-- 2. Cek apakah ada invitation untuk email tertentu
-- Test dengan email yang ada di database
SELECT * FROM team_invitations 
WHERE invited_email = 'eric@gmail.com' 
AND status = 'pending';

SELECT * FROM team_invitations 
WHERE invited_email = 'sugiono@gmail.com' 
AND status = 'pending';

SELECT * FROM team_invitations 
WHERE invited_email = 'c14220175@john.petra.ac.id' 
AND status = 'pending';

-- 3. Cek semua users yang terdaftar
SELECT id, email FROM auth.users ORDER BY created_at DESC;