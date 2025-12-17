'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validasi input kosong
  if (!email || !password) {
    return redirect('/login?error=' + encodeURIComponent('Email dan password harus diisi'))
  }

  // Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return redirect('/login?error=' + encodeURIComponent('Format email tidak valid'))
  }

  // Validasi panjang password
  if (password.length < 6) {
    return redirect('/login?error=' + encodeURIComponent('Password minimal 6 karakter'))
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    console.error('Login Error:', error)
    let errorMessage = 'Gagal masuk, coba lagi'
    
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Email atau password salah'
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Email belum dikonfirmasi, cek inbox email Anda'
    } else if (error.message.includes('Too many requests')) {
      errorMessage = 'Terlalu banyak percobaan, coba lagi nanti'
    }
    
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
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