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

    if (file) {
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
      
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)
      
      fileUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('tasks').insert({
      title,
      status: 'To Do',
      created_by: userId,
      file_url: fileUrl,
      category: 'Work'
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
    <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
      <input 
        type="text" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul Tugas" 
        // UBAH: placeholder:text-gray-600 agar lebih gelap (terlihat hitam/abu tua), text-black untuk teks yang diketik
        className="border border-gray-300 p-2 w-full rounded text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required 
      />
      
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        // UBAH: Pastikan text-black ada di sini untuk teks "No file chosen"
        className="text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        accept=".pdf,.jpg,.png,.docx" 
      />

      <button 
        disabled={uploading} 
        type="submit" 
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-medium mt-2"
      >
        {uploading ? 'Processing...' : 'Add Task'}
      </button>
    </form>
  )
}