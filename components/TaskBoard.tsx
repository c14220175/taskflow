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
  team_id?: string
  attachment_url?: string
  attachment_name?: string
  assigned_profile?: { full_name: string }
  creator_profile?: { full_name: string }
  team?: { name: string }
  profiles?: { full_name: string }
}

type TaskBoardProps = {
  searchQuery?: string
  categoryFilter?: string
  statusFilter?: string
  priorityFilter?: string
  sortFilter?: string
}

export default function TaskBoard({ 
  searchQuery = '', 
  categoryFilter = '', 
  statusFilter = '',
  priorityFilter = '',
  sortFilter = ''
}: TaskBoardProps) {
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

      // Query hanya tasks yang dibuat oleh user yang sedang login
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('created_by', user.id) // Filter hanya tasks user ini
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
        // Ambil profile data terpisah
        const userIds = [...new Set([...data.map(t => t.created_by), ...data.map(t => t.assigned_to)].filter(Boolean))]
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)
        
        // Ambil team data terpisah
        const teamIds = [...new Set(data.map(t => t.team_id).filter(Boolean))]
        console.log('Team IDs found:', teamIds) // Debug: lihat team IDs
        
        const { data: teams } = teamIds.length > 0 ? await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds) : { data: [] }
        
        console.log('Teams data:', teams) // Debug: lihat data teams
        
        // Gabungkan data dengan fallback ke email
        const tasksWithProfiles = data.map(task => {
          const creatorProfile = profiles?.find(p => p.id === task.created_by)
          const assignedProfile = profiles?.find(p => p.id === task.assigned_to)
          const teamInfo = teams?.find(t => t.id === task.team_id)
          
          return {
            ...task,
            creator_profile: {
              full_name: creatorProfile?.full_name || 'task0' // fallback untuk task0@gmail.com
            },
            assigned_profile: assignedProfile ? {
              full_name: assignedProfile.full_name || 'Unknown'
            } : null,
            team: teamInfo || null
          }
        })
        
        console.log('Tasks with profiles and teams:', tasksWithProfiles) // Debug: lihat hasil akhir
        
        // Apply search filter
        const filteredTasks = searchQuery 
          ? tasksWithProfiles.filter(task => 
              task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : tasksWithProfiles
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
                        {task.team && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            🏢 {task.team.name}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <User size={12} />
                        {task.assigned_profile?.full_name && (
                          <span>Assigned to: {task.assigned_profile.full_name}</span>
                        )}
                        {!task.assigned_profile?.full_name && (
                          <span>Personal Task</span>
                        )}
                      </div>
                      
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
                      
                      {task.attachment_url && task.attachment_name && (
                        <div className="mb-2">
                          <a 
                            href={task.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            📎 {task.attachment_name}
                          </a>
                          {task.attachment_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <img 
                              src={task.attachment_url} 
                              alt={task.attachment_name}
                              className="mt-2 max-w-full h-auto rounded border"
                              style={{ maxHeight: '200px' }}
                            />
                          )}
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