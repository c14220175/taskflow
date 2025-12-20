-- Debug Team Invitations
-- Jalankan script ini di Supabase SQL Editor untuk debug

-- 1. Cek semua invitations yang ada
SELECT 
  ti.*,
  t.name as team_name,
  u.email as inviter_email
FROM team_invitations ti
LEFT JOIN teams t ON ti.team_id = t.id
LEFT JOIN auth.users u ON ti.invited_by = u.id
ORDER BY ti.created_at DESC;

-- 2. Cek policy yang ada
SELECT * FROM pg_policies WHERE tablename = 'team_invitations';

-- 3. Fix policy untuk team_invitations
DROP POLICY IF EXISTS "invitations_select" ON team_invitations;
CREATE POLICY "invitations_select" ON team_invitations FOR SELECT USING (
  auth.uid() = invited_by OR 
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 4. Test query yang digunakan di Inbox component
SELECT 
  ti.*,
  t.name as team_name
FROM team_invitations ti
LEFT JOIN teams t ON ti.team_id = t.id
WHERE ti.invited_email = 'EMAIL_YANG_DIINVITE' -- Ganti dengan email yang diinvite
AND ti.status = 'pending'
ORDER BY ti.created_at DESC;