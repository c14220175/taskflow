'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, X } from 'lucide-react'

type CreateTaskFormProps = {
  userId: string
}

type Team = {
  id: string
  name: string
  created_by: string
}

type TeamMember = {
  user_id: string
  profiles: {
    full_name: string
    email: string
  }
}

export default function CreateTaskForm({ userId }: CreateTaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Personal')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const supabase = createClient()

  const isTeamLeader = teams.find(t => t.id === selectedTeam)?.created_by === userId

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data: createdTeams } = await supabase
          .from('teams')
          .select('id, name, created_by')
          .eq('created_by', userId)

        const { data: memberTeams } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name, created_by)')
          .eq('user_id', userId)

        const allTeams: Team[] = [...(createdTeams || [])]

        if (memberTeams) {
          memberTeams.forEach((mt: any) => {
            const teamData = Array.isArray(mt.teams) ? mt.teams[0] : mt.teams

            if (teamData && !allTeams.find(t => t.id === teamData.id)) {
              allTeams.push(teamData)
            }
          })
        }

        setTeams(allTeams)
      } catch (error) {
        console.error('Error fetching teams:', error)
      }
    }

    fetchTeams()
  }, [userId])

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!selectedTeam) {
        setTeamMembers([])
        setAssignedTo('')
        return
      }

      try {
        const { data } = await supabase
          .from('team_members')
          .select('user_id, profiles(full_name, email)')
          .eq('team_id', selectedTeam)

        if (data) {
          const formattedMembers = data.map((item: any) => ({
            user_id: item.user_id,
            profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
          }))

          setTeamMembers(formattedMembers as any)
        }
      } catch (error) {
        console.error('Error fetching team members:', error)
      }
    }

    fetchTeamMembers()
  }, [selectedTeam])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      setFile(selectedFile)
    }
  }

  const uploadFile = async (file: File) => {
    try {
      setUploadProgress(10)
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      setUploadProgress(30)

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error
      setUploadProgress(70)

      const { data: urlData } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName)

      setUploadProgress(100)
      return { url: urlData.publicUrl, name: file.name }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a task title')
      return
    }
    setIsLoading(true)

    try {
      let attachmentUrl = null
      let attachmentName = null

      if (file) {
        try {
          const uploadResult = await uploadFile(file)
          attachmentUrl = uploadResult.url
          attachmentName = uploadResult.name
        } catch (error) {
          alert('Failed to upload file. Task will be created without attachment.')
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category,
          priority,
          due_date: dueDate || null,
          created_by: userId,
          status: 'To Do',
          team_id: selectedTeam || null,
          assigned_to: assignedTo || null,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName
        })
        .select()

      if (error) throw error

      setTitle('')
      setDescription('')
      setCategory('Personal')
      setPriority('Medium')
      setDueDate('')
      setSelectedTeam('')
      setAssignedTo('')
      setFile(null)
      setUploadProgress(0)
      alert('✅ Task created successfully!')

    } catch (error: any) {
      console.error('Error creating task:', error)
      alert('❌ Failed to create task: ' + error.message)
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Title
        </label>
        <input
          type="text"
          placeholder="Enter task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          placeholder="Add description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date (Optional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign to Team (Optional)
        </label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          disabled={isLoading}
        >
          <option value="">Personal Task</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTeam && teamMembers.length > 0 && isTeamLeader && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign to Member
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            disabled={isLoading}
          >
            <option value="">Select member...</option>
            {teamMembers.map(member => (
              <option key={member.user_id} value={member.user_id}>
                {member.profiles?.full_name || member.profiles?.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedTeam && !isTeamLeader && (
        <div className="text-xs text-gray-500 italic">
          Only Team Leader can assign tasks to members.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachment (Max 5MB)
        </label>
        <div className="flex items-center gap-2">
          <label className="flex-1 cursor-pointer">
            <div className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center">
              {file ? (
                <span className="text-sm text-gray-700 flex items-center justify-center gap-2">
                  <Upload size={16} />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                <span className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <Upload size={16} />
                  Click to upload file (Optional)
                </span>
              )}
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
          </label>
          {file && (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          )}
        </div>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim()}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {isLoading ? 'Creating Task...' : 'Create Task'}
      </button>
    </div>
  )
}