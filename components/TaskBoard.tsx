'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Task = {
  id: string
  title: string
  status: 'To Do' | 'In Progress' | 'Done'
  category: string
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const supabase = createClient()

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setTasks(data)
  }

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Change received!', payload)
        fetchTasks() 
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4">
      {['To Do', 'In Progress', 'Done'].map((status) => (
        <div key={status} className="bg-gray-100 p-4 rounded-lg">
          {/* UBAH: Tambahkan text-black */}
          <h2 className="font-bold mb-4 text-black">{status}</h2>
          {tasks
            .filter((t) => t.status === status)
            .map((task) => (
              <div key={task.id} className="bg-white p-3 mb-2 shadow rounded">
                {/* UBAH: Tambahkan text-black */}
                <p className="font-semibold text-black">{task.title}</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {task.category}
                </span>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}