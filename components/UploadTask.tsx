'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type CreateTaskFormProps = {
  userId: string
}

export default function CreateTaskForm({ userId }: CreateTaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Personal')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category,
          priority,
          due_date: dueDate || null,
          created_by: userId,
          status: 'To Do'
        })
        .select()

      if (error) {
        alert('Failed to create task: ' + error.message)
        return
      }

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('Personal')
      setPriority('Medium')
      setDueDate('')
      setAssignedTo('')
      alert('Task created successfully!')
      
    } catch (error) {
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