'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import TeamManagement from '@/components/TeamManagement'
import Inbox from '@/components/Inbox'
import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'

export default function TeamsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        redirect('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-600 to-pink-500 shadow-lg border-b border-transparent px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold hover:text-blue-100">
            TaskFlow
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="hover:text-blue-100">
              Dashboard
            </Link>
            <span className="text-blue-200">Teams</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <p className="text-xs text-blue-100">Welcome, {user.email}</p>
          <div className="bg-white px-3 py-1 rounded-full shadow-sm">
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TeamManagement userId={user.id} />
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Inbox userId={user.id} userEmail={user.email} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}