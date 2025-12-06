import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TaskBoard from '@/components/TaskBoard'
import DashboardStats from '@/components/DashboardStats'
import CreateTaskForm from '@/components/UploadTask' // Pastikan nama file sesuai
import SignOutButton from '@/components/SignOutButton'

export default async function Home() {
  // 1. Cek User Session di Server
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // Jika tidak ada user login, redirect ke login page
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navbar Sederhana */}
      <nav className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">TaskFlow</h1>
          <p className="text-xs text-gray-500">Welcome, {user.email}</p>
        </div>
        <div className="flex gap-4 items-center">
             {/* Bisa tambah menu Team di sini nanti */}
            <SignOutButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Bagian 1: Statistik Dashboard */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Overview</h2>
          <DashboardStats />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Bagian 2: Form Buat Task (Sebelah Kiri) */}
          <aside className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Create New Task</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              {/* Kirim User ID ke form agar task tercatat atas nama user */}
              <CreateTaskForm userId={user.id} />
            </div>
          </aside>

          {/* Bagian 3: Board Task (Sebelah Kanan - Lebih Lebar) */}
          <section className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-semibold text-gray-700">My Tasks</h2>
               {/* Filter bisa ditambahkan disini nanti */}
            </div>
            <TaskBoard />
          </section>
        </div>
      </main>
    </div>
  )
}