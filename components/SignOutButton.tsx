'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh() // Refresh untuk trigger redirect di server
  }

  return (
    <button 
      onClick={handleSignOut}
      className="text-sm font-medium text-red-600 hover:text-red-800"
    >
      Sign Out
    </button>
  )
}