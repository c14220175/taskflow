-- Fix Database untuk Attachment dan Created By
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tambah kolom attachment ke tabel tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- 2. Tambah kolom team_id ke tabel tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- 3. Verifikasi struktur tabel
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'tasks' 
-- ORDER BY ordinal_position;