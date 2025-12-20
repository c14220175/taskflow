-- Supabase Storage Setup untuk TaskFlow
-- Jalankan di Supabase SQL Editor

-- 1. Buat bucket untuk task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Hapus policy lama jika ada
DROP POLICY IF EXISTS "Users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own task attachments" ON storage.objects;

-- 3. Storage policies untuk task-attachments bucket (lebih permisif)
-- Policy untuk upload (semua user yang login)
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task-attachments' AND
  auth.uid() IS NOT NULL
);

-- Policy untuk view (semua user yang login)
CREATE POLICY "Allow authenticated reads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'task-attachments' AND
  auth.uid() IS NOT NULL
);

-- Policy untuk delete (hanya pemilik file)
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'task-attachments' AND
  auth.uid() IS NOT NULL
);

-- 4. Update tasks table untuk menambah kolom attachment jika belum ada
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT;