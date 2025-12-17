'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Validasi input kosong
  if (!email || !password) {
    return redirect('/signup?error=' + encodeURIComponent('Email dan password harus diisi'))
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return redirect('/signup?error=' + encodeURIComponent('Format email tidak valid'))
  }

  // Validasi panjang password
  if (password.length < 6) {
    return redirect('/signup?error=' + encodeURIComponent('Password minimal 6 karakter'))
  }

  // Validasi kekuatan password
  if (!/(?=.*[a-z])/.test(password)) {
    return redirect('/signup?error=' + encodeURIComponent('Password harus mengandung huruf kecil'))
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return redirect('/signup?error=' + encodeURIComponent('Password harus mengandung huruf besar'))
  }

  if (!/(?=.*\d)/.test(password)) {
    return redirect('/signup?error=' + encodeURIComponent('Password harus mengandung angka'))
  }
  
  // Ambil nama dari email
  const full_name = email.split('@')[0]

  // Signup tanpa auto-login
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
        data: {
            full_name: full_name,
            avatar_url: '',
        },
        emailRedirectTo: undefined // Tidak auto-login
    }
  })

  // Pastikan tidak ada session yang terbuat
  await supabase.auth.signOut()

  if (error) {
    console.error('Signup Error:', error)
    let errorMessage = 'Gagal membuat akun, coba lagi'
    
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      errorMessage = 'Email sudah terdaftar, gunakan email lain'
    } else if (error.message.includes('Password should be')) {
      errorMessage = 'Password tidak memenuhi syarat keamanan'
    } else if (error.message.includes('Invalid email')) {
      errorMessage = 'Format email tidak valid'
    }
    
    return redirect(`/signup?error=${encodeURIComponent(errorMessage)}`)
  }

  // Redirect ke login dengan pesan sukses
  redirect('/login?message=' + encodeURIComponent('Akun berhasil dibuat! Silakan login dengan akun Anda.'))
}