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
      try {
        // Fetch teams yang dibuat oleh user (hanya leader yang bisa assign)
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
        
        if (teamsData) {
          setTeams(teamsData)
        }
      } catch (error) {
        setTeams([])
      }
    }
    
    fetchTeams()
  }, [userId])

  // Update team members when team is selected
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (teamId) {
        try {
          const { data: members } = await supabase
            .from('team_members')
            .select(`
              user_id, role,
              profiles(full_name, email)
            `)
            .eq('team_id', teamId)
          
          setTeamMembers(members || [])
          setAssignedTo('') // Reset assigned user when team changes
        } catch (error) {
          setTeamMembers([])
        }
      } else {
        setTeamMembers([])
        setAssignedTo('')
      }
    }
    
    fetchTeamMembers()
  }, [teamId])

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
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    console.log('Uploading file:', fileName)
    
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      throw error
    }
    
    console.log('Upload successful:', data)
    return { fileName, filePath: data.path }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    
    try {
      console.log('Creating task with data:', {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        due_date: dueDate || null,
        created_by: userId,
        assigned_to: assignedTo || null,
        team_id: teamId || null,
        status: 'To Do'
      })
      
      let attachmentUrl = null
      let attachmentName = null
      
      // Upload file if provided
      if (file) {
        try {
          console.log('Starting file upload...')
          
          // Test bucket access first
          const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
          console.log('Available buckets:', buckets, bucketError)
          
          if (bucketError) {
            throw new Error('Cannot access storage: ' + bucketError.message)
          }
          
          const { fileName, filePath } = await uploadFile(file)
          const { data } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(filePath)
          
          attachmentUrl = data.publicUrl
          attachmentName = file.name
          console.log('File uploaded successfully:', attachmentUrl)
        } catch (uploadError) {
          console.error('File upload error:', uploadError)
          alert('File upload failed: ' + uploadError.message + '. Task will be created without attachment.')
          // Continue without attachment
        }
      }
      
      // Test if table exists first
      const { data: tableTest, error: tableError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1)
      
      if (tableError) {
        console.error('Table access error:', tableError)
        alert('Cannot access tasks table: ' + tableError.message)
        return
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
          assigned_to: assignedTo || null,
          team_id: teamId || null,
          status: 'To Do',
          attachment_url: attachmentUrl,
          attachment_name: attachmentName
        })
        .select()

      console.log('Insert result:', { data, error })

      if (error) {
        console.error('Database insert error:', error)
        alert('Gagal membuat task: ' + error.message)
      } else {
        console.log('Task created successfully:', data)
        // Reset form
        setTitle('')
        setDescription('')
        setCategory('Personal')
        setPriority('Medium')
        setDueDate('')
        setFile(null)
        setAssignedTo('')
        setTeamId('')
        alert('Task berhasil dibuat!')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Failed to create task: ' + error.message)
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <p className="text-xs text-gray-500 mt-1">Pilih tanggal deadline untuk task ini</p>
      </div>
      
      {/* Team Selection - Only show teams created by user */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign to My Team (Optional)
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
              {team.name} (Leader)
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Only teams you created are shown</p>
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
            <option value="">Unassigned (Team Task)</option>
            {teamMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profiles?.full_name || member.profiles?.email || 'Team Member'} ({member.role})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Leave unassigned for general team task</p>
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