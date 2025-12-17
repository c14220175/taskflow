# Troubleshooting Tasks Not Showing

## 🔧 Langkah Perbaikan:

### 1. Setup Database Schema Baru
```sql
-- Jalankan di Supabase SQL Editor:
-- Copy paste isi file: database-schema-fixed.sql
```

### 2. Verifikasi Database
- Buka Supabase Dashboard → Table Editor
- Pastikan tabel `tasks` ada
- Pastikan tabel `profiles` ada
- Cek RLS policies aktif

### 3. Test Create Task
- Buka browser console (F12)
- Coba buat task baru
- Lihat log di console:
  - "Fetching tasks for user: [user-id]"
  - "Tasks data: [array]"
  - "Task created successfully"

### 4. Debug Steps
1. **Cek User Login:**
   - Console: Pastikan user ID muncul
   
2. **Cek Database Connection:**
   - Console: Lihat "Tasks data" dan "Tasks error"
   
3. **Cek RLS Policies:**
   - Supabase Dashboard → Authentication → RLS
   - Pastikan policies untuk tasks aktif

### 5. Manual Database Check
```sql
-- Jalankan di Supabase SQL Editor untuk cek data:
SELECT * FROM tasks;
SELECT * FROM profiles;
```

## 🎯 Fitur yang Diperbaiki:

### Due Date/Deadline:
- ✅ Label "Due Date (Optional)" 
- ✅ Minimum date = hari ini
- ✅ Deskripsi "Pilih tanggal deadline"
- ✅ Color coding: Red (overdue), Orange (today), Green (future)
- ✅ Format tanggal Indonesia
- ✅ Status "(Overdue)" dan "(Today)"

### Task Display:
- ✅ Console logging untuk debug
- ✅ Error handling yang lebih baik
- ✅ Alert feedback saat create task
- ✅ RLS policies yang disederhanakan

## 🚨 Jika Tasks Masih Tidak Muncul:

1. **Clear Browser Cache**
2. **Restart Development Server**
3. **Check Console Errors**
4. **Verify Database Schema**
5. **Test dengan Supabase Dashboard**