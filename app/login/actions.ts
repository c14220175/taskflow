'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Validasi input
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?error=Email and password are required')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login Error:', error)
    // Pesan error yang lebih user-friendly
    const errorMessage = error.message === 'Invalid login credentials' 
      ? 'Email atau password salah' 
      : 'Gagal masuk, coba lagi'
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Validasi input
  if (!email || !password) {
    return redirect('/login?error=Email and password are required')
  }

  if (password.length < 6) {
    return redirect('/login?error=Password must be at least 6 characters')
  }
  
  // Ambil nama dari email (sebagai default name untuk profil)
  const full_name = email.split('@')[0]

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        // Data ini akan otomatis masuk ke tabel 'profiles' melalui Trigger SQL
        data: {
            full_name: full_name,
            avatar_url: '',
        }
    }
  })

  if (error) {
    console.error('Signup Error:', error)
    const errorMessage = error.message.includes('already registered') 
      ? 'Email sudah terdaftar' 
      : 'Gagal membuat akun, coba lagi'
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  // Jika signup berhasil tapi perlu konfirmasi email
  if (data.user && !data.session) {
    return redirect('/login?message=Check your email to confirm your account')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}