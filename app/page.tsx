import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TaskBoard from '@/components/TaskBoard'
import DashboardStats from '@/components/DashboardStats'
import CreateTaskForm from '@/components/UploadTask'
import SignOutButton from '@/components/SignOutButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-600 to-pink-500 shadow-lg border-b border-transparent px-6 py-4 flex justify-between items-center text-white">
        <div>
          <h1 className="text-xl font-bold">TaskFlow</h1>
          <p className="text-xs text-blue-100">Welcome, {user.email}</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                <SignOutButton />
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="mb-8">
          {/* UBAH: text-gray-700 -> text-black */}
          <h2 className="text-lg font-semibold mb-4 text-black">Overview</h2>
          <DashboardStats />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            {/* UBAH: text-gray-700 -> text-black */}
            <h2 className="text-lg font-semibold mb-4 text-black">Create New Task</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <CreateTaskForm userId={user.id} />
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
               {/* UBAH: text-gray-700 -> text-black */}
               <h2 className="text-lg font-semibold text-black">My Tasks</h2>
            </div>
            <TaskBoard />
          </section>
        </div>
      </main>
    </div>
  )
}