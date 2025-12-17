'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Edit, User } from 'lucide-react'

type Task = {
  id: string
  title: string
  description?: string
  status: 'To Do' | 'In Progress' | 'Done'
  category: string
  priority: 'Low' | 'Medium' | 'High'
  assigned_to?: string
  created_by: string
  due_date?: string
  attachment_url?: string
  attachment_name?: string
  profiles?: { full_name: string }
}

type TaskBoardProps = {
  searchQuery?: string
  categoryFilter?: string
  statusFilter?: string
}

export default function TaskBoard({ searchQuery = '', categoryFilter = '', statusFilter = '' }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const supabase = createClient()

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found')
        return
      }
      
      setCurrentUserId(user.id)
      console.log('Fetching tasks for user:', user.id)

      // Test basic connection first
      console.log('Testing database connection...')
      
      const { data: testData, error: testError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1)
      
      console.log('Connection test:', { testData, testError })
      
      if (testError) {
        console.error('Connection failed:', testError)
        alert('Database connection failed: ' + testError.message)
        return
      }
      
      // Simple query without joins
      let query = supabase
        .from('tasks')
        .select('id, title, description, category, priority, status, due_date, created_at, created_by')
        .order('created_at', { ascending: false })

      // Apply filters
      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Database error:', error)
        alert('Error loading tasks: ' + error.message)
        return
      }
      
      console.log('Raw tasks data:', data)
      
      if (data) {
        // Apply search filter
        const filteredTasks = searchQuery 
          ? data.filter(task => 
              task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : data
        setTasks(filteredTasks)
        console.log('Setting tasks:', filteredTasks.length, 'tasks')
      }
    } catch (err) {
      console.error('Fetch tasks error:', err)
      alert('Failed to load tasks')
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
    
    if (!error) fetchTasks()
  }

  const deleteTask = async (taskId: string) => {
    if (confirm('Yakin ingin menghapus task ini?')) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      if (!error) fetchTasks()
    }
  }

  const updateTask = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        due_date: task.due_date
      })
      .eq('id', task.id)
    
    if (!error) {
      setEditingTask(null)
      fetchTasks()
    }
  }

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks() 
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [searchQuery, categoryFilter, statusFilter])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['To Do', 'In Progress', 'Done'].map((status) => (
        <div key={status} className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-bold mb-4 text-black">{status}</h2>
          <div className="space-y-3">
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <div key={task.id} className="bg-white p-3 shadow rounded-lg border">
                  {editingTask?.id === task.id ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                        className="w-full p-2 border rounded text-black"
                      />
                      <textarea
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                        className="w-full p-2 border rounded text-black"
                        rows={2}
                      />
                      <select
                        value={editingTask.category}
                        onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                        className="w-full p-2 border rounded text-black"
                      >
                        <option value="Personal">Personal</option>
                        <option value="Work">Work</option>
                        <option value="Study">Study</option>
                        <option value="Health">Health</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateTask(editingTask)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTask(null)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-black">{task.title}</h3>
                        <div className="flex gap-1">
                          {(task.created_by === currentUserId || task.assigned_to === currentUserId) && (
                            <>
                              <button
                                onClick={() => setEditingTask(task)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {task.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.profiles?.full_name && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                          <User size={12} />
                          {task.profiles.full_name}
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className="text-xs mb-2">
                          <span className="text-gray-500">Deadline: </span>
                          <span className={`font-medium ${
                            new Date(task.due_date) < new Date() 
                              ? 'text-red-600' 
                              : new Date(task.due_date).toDateString() === new Date().toDateString()
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}>
                            {new Date(task.due_date).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {new Date(task.due_date) < new Date() && ' (Overdue)'}
                            {new Date(task.due_date).toDateString() === new Date().toDateString() && ' (Today)'}
                          </span>
                        </div>
                      )}
                      
                      {task.attachment_name && (
                        <div className="text-xs text-blue-600 mb-2">
                          📎 {task.attachment_name}
                        </div>
                      )}
                      
                      {/* Status Change Buttons */}
                      <div className="flex gap-1 mt-2">
                        {status !== 'To Do' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'To Do')}
                            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                          >
                            ← To Do
                          </button>
                        )}
                        {status === 'To Do' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'In Progress')}
                            className="text-xs px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded"
                          >
                            Start →
                          </button>
                        )}
                        {status === 'In Progress' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'Done')}
                            className="text-xs px-2 py-1 bg-green-200 hover:bg-green-300 rounded"
                          >
                            Done →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}