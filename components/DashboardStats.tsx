import { createClient } from '@/utils/supabase/server'

export default async function DashboardStats() {
  const supabase = await createClient()
  
  const { count: totalTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })

  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Done')

  return (
    <div className="flex gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 w-full">
        {/* UBAH: text-gray-500 -> text-black */}
        <h3 className="text-black text-sm font-medium">Total Tugas</h3>
        {/* UBAH: text-gray-800 -> text-black */}
        <p className="text-3xl font-bold text-black mt-2">{totalTasks || 0}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 w-full">
        {/* UBAH: text-gray-500 -> text-black */}
        <h3 className="text-black text-sm font-medium">Selesai</h3>
        {/* Biarkan hijau untuk menandakan sukses, atau ubah ke text-black jika ingin hitam total */}
        <p className="text-3xl font-bold text-green-600 mt-2">{completedTasks || 0}</p>
      </div>
    </div>
  )
}