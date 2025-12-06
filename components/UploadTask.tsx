'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CreateTaskForm({ userId }: { userId: string }) {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    let fileUrl = null

    // 1. Logika Upload File 
    if (file) {
      // Validasi ukuran < 5MB (5 * 1024 * 1024 bytes)
      if (file.size > 5000000) {
        alert('File terlalu besar! Maksimal 5MB.')
        setUploading(false)
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file)

      if (uploadError) {
        alert('Gagal upload file')
        setUploading(false)
        return
      }
      
      // Dapatkan URL publik (jika bucket public) atau signed URL
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)
      
      fileUrl = urlData.publicUrl
    }

    // 2. Insert ke Database
    const { error } = await supabase.from('tasks').insert({
      title,
      status: 'To Do',
      created_by: userId,
      file_url: fileUrl, // Simpan link file
      category: 'Work' // Contoh default
    })

    if (!error) {
      alert('Task berhasil dibuat!')
      setTitle('')
      setFile(null)
    } else {
      alert('Gagal membuat task')
    }
    setUploading(false)
  }

  return (
    <form onSubmit={handleCreateTask} className="p-4 border rounded">
      <input 
        type="text" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul Tugas" 
        className="border p-2 w-full mb-2"
        required 
      />
      
      {/* Input File */}
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-2"
        accept=".pdf,.jpg,.png,.docx" // 
      />

      <button disabled={uploading} type="submit" className="bg-blue-600 text-white p-2 rounded">
        {uploading ? 'Processing...' : 'Add Task'}
      </button>
    </form>
  )
}