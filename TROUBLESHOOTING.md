# Troubleshooting: Gagal Membuat Akun Baru

## Langkah-langkah Perbaikan

### 1. Periksa Environment Variables
Pastikan file `.env.local` memiliki konfigurasi yang benar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Cara mendapatkan:**
1. Buka dashboard Supabase: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik Settings > API
4. Copy `Project URL` dan `anon/public key`

### 2. Setup Database
Jalankan file `supabase-setup.sql` di Supabase SQL Editor:

1. Buka dashboard Supabase
2. Klik SQL Editor di sidebar
3. Klik "New Query"
4. Copy-paste isi file `supabase-setup.sql`
5. Klik "Run" atau tekan Ctrl+Enter

File ini akan:
- Membuat tabel `profiles` dan `tasks`
- Setup Row Level Security (RLS)
- Membuat trigger untuk auto-create profile
- Setup storage bucket

### 3. Nonaktifkan Email Confirmation (Untuk Development)
Jika Anda ingin testing tanpa konfirmasi email:

1. Buka dashboard Supabase
2. Klik Authentication > Settings
3. Scroll ke "Email Auth"
4. **Matikan** "Enable email confirmations"
5. Klik Save

**PENTING:** Untuk production, sebaiknya aktifkan kembali email confirmation!

### 4. Periksa Password Requirements
Password harus memenuhi syarat:
- Minimal 6 karakter
- Mengandung huruf besar (A-Z)
- Mengandung huruf kecil (a-z)
- Mengandung angka (0-9)

Contoh password valid: `Password123`

### 5. Periksa Email Format
Email harus valid, contoh:
- ✅ `user@example.com`
- ✅ `test.user@gmail.com`
- ❌ `userexample.com` (tidak ada @)
- ❌ `user@example` (tidak ada domain)

### 6. Cek Console Browser untuk Error
1. Buka browser DevTools (F12)
2. Klik tab "Console"
3. Coba signup lagi
4. Lihat error message yang muncul

### 7. Cek Server Logs
Jika menggunakan development server:
1. Lihat terminal tempat `npm run dev` berjalan
2. Cari error message dengan prefix "Signup Error:"
3. Error message akan memberikan petunjuk masalah

## Masalah Umum dan Solusi

### Error: "Email sudah terdaftar"
**Solusi:** Gunakan email lain atau hapus user dari Supabase:
1. Dashboard > Authentication > Users
2. Cari email yang ingin dihapus
3. Klik titik tiga > Delete user

### Error: "Database error"
**Solusi:** 
1. Pastikan tabel `profiles` sudah dibuat
2. Jalankan ulang `supabase-setup.sql`
3. Periksa RLS policies sudah aktif

### Error: "signup is disabled"
**Solusi:**
1. Dashboard > Authentication > Settings
2. Pastikan "Enable sign ups" diaktifkan

### Error: "Invalid email"
**Solusi:**
1. Periksa format email
2. Pastikan tidak ada spasi di awal/akhir
3. Gunakan email yang valid

### Signup berhasil tapi tidak bisa login
**Solusi:**
1. Periksa apakah email confirmation diaktifkan
2. Jika ya, cek inbox email untuk konfirmasi
3. Atau nonaktifkan email confirmation (lihat langkah 3)

### Error: "Terjadi kesalahan tidak terduga"
**Solusi:**
1. Restart development server
2. Clear browser cache
3. Periksa koneksi internet
4. Periksa status Supabase: https://status.supabase.com

## Testing Signup

Untuk testing, gunakan:
- Email: `test@example.com`
- Password: `Test123456`

Jika berhasil, Anda akan diarahkan ke halaman login dengan pesan sukses.

## Kontak Support

Jika masalah masih berlanjut:
1. Screenshot error message
2. Copy error dari console browser
3. Copy error dari server logs
4. Hubungi administrator atau buat issue di repository