'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Mengambil data dari form
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login Error:', error)
    return redirect('/login?error=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Ambil nama dari email (sebagai default name untuk profil)
  const full_name = email.split('@')[0]

  const { error } = await supabase.auth.signUp({
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
    return redirect('/login?error=Could not create user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}