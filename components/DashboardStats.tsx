import { createClient } from '@/utils/supabase/server'

export default async function DashboardStats() {
  // Tambahkan 'await' di sini karena createClient sekarang async
  const supabase = await createClient()
  
  // Mengambil jumlah total tasks
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })

  // Mengambil jumlah tasks yang sudah selesai
  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Done')

  return (
    <div className="flex gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 w-full">
        <h3 className="text-gray-500 text-sm font-medium">Total Tugas</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">{totalTasks || 0}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 w-full">
        <h3 className="text-gray-500 text-sm font-medium">Selesai</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">{completedTasks || 0}</p>
      </div>
    </div>
  )
}