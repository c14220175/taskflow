'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Trash2, Edit, X, Save, ShieldAlert, Users,
  Paperclip, FileText, Image as ImageIcon, Download, ExternalLink
} from 'lucide-react'

type Team = {
  id: string
  name: string
  created_by: string
}

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
  assigned_profile?: { full_name: string; email: string }
  creator_profile?: { full_name: string; email: string }
  team?: Team
}

type TeamMember = {
  user_id: string
  profiles: {
    full_name: string
    email: string
  }
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

  // Data untuk dropdown/pilihan
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const supabase = createClient()

  // Cek File Image
  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)
  }

  const fetchTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const { data: myMemberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)

      const membershipTeamIds = myMemberships?.map(m => m.team_id) || []

      const { data: myCreatedTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', user.id)

      const createdTeamIds = myCreatedTeams?.map(t => t.id) || []

      const allRelevantTeamIds = [...new Set([...membershipTeamIds, ...createdTeamIds])]

      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      let orString = `created_by.eq.${user.id},assigned_to.eq.${user.id}`

      if (allRelevantTeamIds.length > 0) {
        orString += `,team_id.in.(${allRelevantTeamIds.join(',')})`
      }

      query = query.or(orString)

      if (categoryFilter) query = query.eq('category', categoryFilter)
      if (statusFilter) query = query.eq('status', statusFilter)
      if (priorityFilter) query = query.eq('priority', priorityFilter)

      const { data, error } = await query

      if (error) {
        console.error('Database error:', error)
        return
      }

      if (data) {
        const userIds = [...new Set([...data.map(t => t.created_by), ...data.map(t => t.assigned_to)].filter(Boolean))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        const teamIds = [...new Set(data.map(t => t.team_id).filter(Boolean))]
        const { data: teamsData } = teamIds.length > 0
          ? await supabase.from('teams').select('id, name, created_by').in('id', teamIds)
          : { data: [] }

        let tasksWithProfiles = data.map(task => {
          const creatorProfile = profiles?.find(p => p.id === task.created_by)
          const assignedProfile = profiles?.find(p => p.id === task.assigned_to)
          const teamInfo = teamsData?.find(t => t.id === task.team_id)

          return {
            ...task,
            creator_profile: {
              full_name: creatorProfile?.full_name || creatorProfile?.email?.split('@')[0] || 'Unknown',
              email: creatorProfile?.email || ''
            },
            assigned_profile: assignedProfile ? {
              full_name: assignedProfile.full_name || assignedProfile.email?.split('@')[0] || 'Unknown',
              email: assignedProfile.email || ''
            } : undefined,
            team: teamInfo || undefined
          }
        })

        if (searchQuery) {
          tasksWithProfiles = tasksWithProfiles.filter(task =>
            task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        if (sortFilter) {
          tasksWithProfiles = [...tasksWithProfiles].sort((a, b) => {
            switch (sortFilter) {
              case 'deadline-asc':
                if (!a.due_date && !b.due_date) return 0
                if (!a.due_date) return 1
                if (!b.due_date) return -1
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
              case 'priority-desc':
                const pOrder: { [key: string]: number } = { 'High': 3, 'Medium': 2, 'Low': 1 }
                return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0)
              case 'created-desc':
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
              default:
                return 0
            }
          })
        }

        setTasks(tasksWithProfiles)
      }
    } catch (err) {
      console.error('Fetch tasks error:', err)
    }
  }, [searchQuery, categoryFilter, statusFilter, priorityFilter, sortFilter, supabase])

  const fetchTeams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: createdTeams } = await supabase
        .from('teams')
        .select('id, name, created_by')
        .eq('created_by', user.id)

      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name, created_by)')
        .eq('user_id', user.id)

      const allTeams: Team[] = [...(createdTeams || [])]

      if (memberTeams) {
        memberTeams.forEach((mt: any) => {
          if (mt.teams && !allTeams.find(t => t.id === mt.teams.id)) {
            allTeams.push(mt.teams)
          }
        })
      }
      setTeams(allTeams)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  useEffect(() => {
    const fetchMembers = async () => {
      if (!editingTask?.team_id) {
        setTeamMembers([])
        return
      }
      const { data } = await supabase
        .from('team_members')
        .select('user_id, profiles(full_name, email)')
        .eq('team_id', editingTask.team_id)

      if (data) {
        const formattedMembers: TeamMember[] = data.map((item: any) => ({
          user_id: item.user_id,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
        }))

        setTeamMembers(formattedMembers)
      }
    }
    fetchMembers()
  }, [editingTask?.team_id, supabase])

  const canEditOrDelete = (task: Task) => {
    if (!currentUserId) return false
    if (!task.team_id) {
      return task.created_by === currentUserId
    }
    if (task.team) {
      return task.team.created_by === currentUserId
    }
    return false
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    if (!error) fetchTasks()
  }

  const deleteTask = async (taskId: string) => {
    if (confirm('Yakin ingin menghapus task ini?')) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (!error) fetchTasks()
      else alert("Gagal menghapus: " + error.message)
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
        due_date: task.due_date || null,
        team_id: task.team_id || null,
        assigned_to: task.assigned_to || null
      })
      .eq('id', task.id)

    if (!error) {
      setEditingTask(null)
      fetchTasks()
    } else {
      alert('Failed to update task: ' + error.message)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchTeams()

    const channel = supabase
      .channel('realtime-tasks-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Change received!', payload)
          fetchTasks()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTasks, supabase])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {['To Do', 'In Progress', 'Done'].map((status) => (
        <div key={status} className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 min-h-[500px]">
          <h2 className="font-bold mb-4 text-gray-700 flex items-center justify-between">
            {status}
            <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full">
              {tasks.filter(t => t.status === status).length}
            </span>
          </h2>

          <div className="space-y-3">
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <div key={task.id} className="bg-white p-4 shadow-sm hover:shadow-md transition-shadow rounded-lg border border-gray-100 group">

                  {editingTask?.id === task.id ? (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center mb-2 border-b pb-2">
                        <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                          <Edit size={14} /> Edit Task
                        </h4>
                        <button onClick={() => setEditingTask(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full">
                          <X size={16} />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500">Title</label>
                        <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="text-black w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500">Description</label>
                        <textarea value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="text-black w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Category</label>
                          <select value={editingTask.category} onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })} className="text-black w-full p-2 border rounded text-sm">
                            <option value="Personal">Personal</option>
                            <option value="Work">Work</option>
                            <option value="Study">Study</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Priority</label>
                          <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })} className="text-black w-full p-2 border rounded text-sm">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>

                      {editingTask.attachment_url && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border flex items-center gap-2">
                          <Paperclip size={12} />
                          <span className="truncate max-w-[200px]">{editingTask.attachment_name || 'Attached File'}</span>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium text-gray-500">Group / Team</label>
                        <select
                          value={editingTask.team_id || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, team_id: e.target.value, assigned_to: '' })}
                          className="text-black w-full p-2 border rounded text-sm bg-gray-50"
                        >
                          <option value="">Personal (No Team)</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      </div>

                      {editingTask.team_id && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Assign To</label>
                          {canEditOrDelete(task) ? (
                            <select
                              value={editingTask.assigned_to || ''}
                              onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                              className="text-black w-full p-2 border rounded text-sm"
                            >
                              <option value="">-- Unassigned --</option>
                              {teamMembers.map(member => (
                                <option key={member.user_id} value={member.user_id}>
                                  {member.profiles?.full_name || member.profiles?.email}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-black text-sm bg-gray-100 p-2 rounded text-gray-500 italic">
                              Only Team Leader can assign members.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => updateTask(editingTask)} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 flex justify-center items-center gap-2">
                          <Save size={16} /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (

                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 leading-snug">{task.title}</h3>

                        {canEditOrDelete(task) && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingTask(task)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => deleteTask(task.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      {task.attachment_url && (
                        <div className="mb-3">
                          {isImageFile(task.attachment_url) ? (
                            // JIKA GAMBAR
                            <div className="relative group/img overflow-hidden rounded-md border border-gray-200">
                              <img
                                src={task.attachment_url}
                                alt="Attachment"
                                className="w-full h-32 object-cover transition-transform duration-300 group-hover/img:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a
                                  href={task.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                                  title="Preview Full Image"
                                >
                                  <ExternalLink size={16} />
                                </a>
                                <a
                                  href={task.attachment_url}
                                  download={task.attachment_name || 'download'}
                                  className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                  title="Download Image"
                                >
                                  <Download size={16} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            // JIKA FILE LAIN (PDF, DOC, ZIP, DLL)
                            <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="bg-white p-1.5 rounded border">
                                  <FileText size={16} className="text-blue-500" />
                                </div>
                                <span className="truncate text-gray-700 font-medium max-w-[120px]" title={task.attachment_name}>
                                  {task.attachment_name || 'Attachment'}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <a
                                  href={task.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                  title="Open/Preview"
                                >
                                  <ExternalLink size={14} />
                                </a>
                                <a
                                  href={task.attachment_url}
                                  download={task.attachment_name}
                                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                  title="Download"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">
                          {task.category}
                        </span>
                        {task.team && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1 font-medium">
                            <Users size={10} /> {task.team.name}
                          </span>
                        )}
                        {task.attachment_url && !isImageFile(task.attachment_url) && !task.description && (
                          // Badge kecil jika ada attachment tapi tidak di-preview (misal deskripsi kosong)
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                            <Paperclip size={10} /> File
                          </span>
                        )}
                      </div>

                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                          <div className="flex items-center gap-1.5">
                            {task.assigned_profile ? (
                              <>
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                  {task.assigned_profile.full_name.charAt(0)}
                                </div>
                                <span className="truncate max-w-[80px]">{task.assigned_profile.full_name}</span>
                              </>
                            ) : (
                              <span className="italic text-gray-400">Unassigned</span>
                            )}
                          </div>

                          {task.due_date && (
                            <span className={`${new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : ''}`}>
                              {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>

                        {task.team && !canEditOrDelete(task) && (
                          <div className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
                            <ShieldAlert size={10} /> View Only
                          </div>
                        )}

                        <div className="flex gap-1 pt-1">
                          {status !== 'To Do' && (
                            <button onClick={() => updateTaskStatus(task.id, 'To Do')} className="flex-1 text-xs py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors">
                              ← To Do
                            </button>
                          )}
                          {status === 'To Do' && (
                            <button onClick={() => updateTaskStatus(task.id, 'In Progress')} className="flex-1 text-xs py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded transition-colors">
                              Start
                            </button>
                          )}
                          {status === 'In Progress' && (
                            <button onClick={() => updateTaskStatus(task.id, 'Done')} className="flex-1 text-xs py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded transition-colors">
                              Done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {tasks.filter(t => t.status === status).length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-400">No tasks here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}