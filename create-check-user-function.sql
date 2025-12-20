-- Create RPC Function untuk Check User Email
-- Jalankan script ini di Supabase SQL Editor

CREATE OR REPLACE FUNCTION check_user_exists(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;