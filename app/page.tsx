'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import TaskBoard from '@/components/TaskBoard'
import DashboardStats from '@/components/DashboardStats'
import CreateTaskForm from '@/components/UploadTask'
import TaskFilters from '@/components/TaskFilters'
import SignOutButton from '@/components/SignOutButton'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
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
          <h1 className="text-xl font-bold">TaskFlow</h1>
          <div className="flex gap-4 text-sm">
            <span className="text-blue-200">Dashboard</span>
            <a href="/teams" className="hover:text-blue-100">
              Teams
            </a>
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
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-black">Overview</h2>
          <DashboardStats />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4 text-black">Create New Task</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <CreateTaskForm userId={user.id} />
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-semibold text-black">My Tasks</h2>
            </div>
            
            {/* Search and Filters */}
            <TaskFilters 
              onSearchChange={setSearchQuery}
              onCategoryChange={setCategoryFilter}
              onStatusChange={setStatusFilter}
            />
            
            {/* Task Board */}
            <TaskBoard 
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              statusFilter={statusFilter}
            />
          </section>
        </div>
      </main>
    </div>
  )
}