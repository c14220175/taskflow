'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, X } from 'lucide-react'

type CreateTaskFormProps = {
  userId: string
}

export default function CreateTaskForm({ userId }: CreateTaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Personal')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [teamId, setTeamId] = useState('')
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Fetch teams and team members
  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select(`
          id, name,
          team_members (
            user_id,
            profiles (
              id, full_name, email
            )
          )
        `)
      if (data) setTeams(data)
    }
    fetchTeams()
  }, [])

  // Update team members when team is selected
  useEffect(() => {
    if (teamId) {
      const selectedTeam = teams.find(team => team.id === teamId)
      setTeamMembers(selectedTeam?.team_members || [])
      setAssignedTo('') // Reset assigned user when team changes
    } else {
      setTeamMembers([])
      setAssignedTo('')
    }
  }, [teamId, teams])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validasi file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      // Validasi file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Only PDF, JPG, PNG, and DOCX files are allowed')
        return
      }
      
      setFile(selectedFile)
    }
  }

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .upload(fileName, file)
    
    if (error) throw error
    return { fileName, filePath: data.path }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    
    try {
      let attachmentUrl = null
      let attachmentName = null
      
      // Upload file if exists
      if (file) {
        const { fileName, filePath } = await uploadFile(file)
        const { data } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(filePath)
        
        attachmentUrl = data.publicUrl
        attachmentName = file.name
      }
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category,
          priority,
          due_date: dueDate || null,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          created_by: userId,
          assigned_to: assignedTo || null,
          team_id: teamId || null,
          status: 'To Do'
        })

      if (!error) {
        // Reset form
        setTitle('')
        setDescription('')
        setCategory('Personal')
        setPriority('Medium')
        setDueDate('')
        setFile(null)
        setAssignedTo('')
        setTeamId('')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task')
    }
    
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
          required
        />
      </div>
      
      <div>
        <textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
        >
          <option value="Personal">Personal</option>
          <option value="Work">Work</option>
          <option value="Study">Study</option>
          <option value="Health">Health</option>
        </select>
        
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
        >
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
        </select>
      </div>
      
      <div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
        />
      </div>
      
      {/* Team Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign to Team (Optional)
        </label>
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
        >
          <option value="">Personal Task</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Team Member Assignment */}
      {teamId && teamMembers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Team Member (Optional)
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            disabled={isLoading}
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profiles?.full_name || member.profiles?.email || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachment (PDF, JPG, PNG, DOCX - Max 5MB)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-black"
          >
            <Upload size={16} />
            Choose File
          </label>
          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading || !title.trim()}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isLoading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  )
}