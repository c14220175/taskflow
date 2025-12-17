-- Supabase Storage Setup untuk TaskFlow
-- Jalankan di Supabase SQL Editor

-- 1. Buat bucket untuk task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true);

-- 2. Storage policies untuk task-attachments bucket
-- Policy untuk upload (hanya user yang login)
CREATE POLICY "Users can upload task attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'task-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy untuk view (hanya user yang login)
CREATE POLICY "Users can view task attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'task-attachments' AND
  auth.uid() IS NOT NULL
);

-- Policy untuk delete (hanya pemilik file)
CREATE POLICY "Users can delete own task attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'task-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Update tasks table untuk menambah kolom attachment jika belum ada
-- (Ini sudah ada di schema sebelumnya, tapi untuk memastikan)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT;