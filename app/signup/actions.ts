'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return redirect('/signup?error=Email dan password harus diisi')
  }

  if (password.length < 6) {
    return redirect('/signup?error=Password minimal 6 karakter')
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: email.split('@')[0]
      }
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    
    if (error.message.includes('already registered')) {
      return redirect('/signup?error=Email sudah terdaftar')
    }
    
    return redirect('/signup?error=Gagal membuat akun')
  }

  // Logout setelah signup
  await supabase.auth.signOut()
  
  redirect('/login?message=Akun berhasil dibuat! Silakan login.')
}