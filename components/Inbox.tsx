'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mail, Check, X, Loader2 } from 'lucide-react'

// Definisi tipe data yang diperketat sesuai dengan relasi database
type Invitation = {
  id: string
  team_id: string
  invited_email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  teams: {
    name: string
  }
  profiles: {
    full_name: string
    email: string
  }
}

type InboxProps = {
  userId: string
  userEmail: string
}

export default function Inbox({ userId, userEmail }: InboxProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const supabase = createClient()

  // Menggunakan useCallback agar fungsi stabil dan bisa dipanggil ulang setelah aksi
  const fetchInvitations = useCallback(async () => {
    if (!userEmail) return
    
    try {
<<<<<<< HEAD
      console.log('Fetching invitations for email:', userEmail)
      
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('invited_email', userEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      console.log('Invitations query result:', { data, error })

      if (data && data.length > 0) {
        // Get team and inviter info for each invitation
        const enrichedInvitations = await Promise.all(
          data.map(async (invitation) => {
            console.log('Processing invitation:', invitation)
            
            // Get team name with error handling
            const { data: teamData, error: teamError } = await supabase
              .from('teams')
              .select('name')
              .eq('id', invitation.team_id)
              .maybeSingle()
            
            console.log('Team query:', { teamData, teamError, teamId: invitation.team_id })
            
            // Get inviter info with error handling
            const { data: inviterData, error: inviterError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', invitation.invited_by)
              .maybeSingle()
            
            console.log('Inviter query:', { inviterData, inviterError, inviterId: invitation.invited_by })
            
            return {
              ...invitation,
              teams: teamData || { name: `Team ${invitation.team_id.slice(0, 8)}` },
              profiles: inviterData || { full_name: 'Team Leader', email: '' }
            }
          })
        )
        
        setInvitations(enrichedInvitations)
      } else {
        setInvitations([])
      }
=======
      setFetching(true)
      // Perbaikan: Query menggunakan email huruf kecil untuk menghindari mismatch case-sensitive
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          teams(name),
          inviter_profile:profiles!invited_by(full_name, email)
        `)
        .eq('invited_email', userEmail.toLowerCase())
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations((data as any) || [])
>>>>>>> c91b13a6a13d9cf078eb2390c95a90e0fabd3826
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setFetching(false)
    }
  }, [userEmail, supabase])

  const respondToInvitation = async (invitation: Invitation, response: 'accepted' | 'rejected') => {
    setLoading(true)
    
    try {
      // 1. Update status undangan di tabel team_invitations
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ 
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      // 2. Jika diterima, masukkan user ke tabel team_members
      if (response === 'accepted') {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: invitation.team_id,
            user_id: userId,
            role: 'member'
          })

        if (memberError) throw memberError
      }

      alert(response === 'accepted' ? 'Berhasil bergabung dengan tim!' : 'Undangan ditolak.')
      
      // Refresh daftar undangan dan paksa refresh halaman agar daftar tim terupdate
      await fetchInvitations()
      window.location.reload() 
    } catch (error: any) {
      console.error('Action failed:', error)
      alert('Gagal memproses undangan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  if (fetching) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
        <Mail size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 font-medium">Tidak ada undangan pending</p>
        <p className="text-xs text-gray-400 mt-1">Cek kembali email Anda: {userEmail}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Mail size={18} className="text-blue-600" />
          Undangan Masuk ({invitations.length})
        </h3>
      </div>
      
      {invitations.map((invitation) => (
<<<<<<< HEAD
        <div key={invitation.id} className="bg-white p-4 rounded-lg shadow border">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-black">
                Invitation to join "{invitation.teams?.name || 'Loading...'}"
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                From: {invitation.profiles?.full_name || invitation.profiles?.email || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(invitation.created_at).toLocaleDateString()}
              </p>
            </div>
=======
        <div 
          key={invitation.id} 
          className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
        >
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Team Invite
            </span>
            <h4 className="font-semibold text-gray-900 mt-2 text-lg">
              {invitation.teams?.name}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Diundang oleh: <span className="font-medium text-gray-800">
                {invitation.inviter_profile?.full_name || invitation.inviter_profile?.email}
              </span>
            </p>
            <p className="text-[10px] text-gray-400 mt-2 italic">
              Dikirim pada {new Date(invitation.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
>>>>>>> c91b13a6a13d9cf078eb2390c95a90e0fabd3826
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => respondToInvitation(invitation, 'accepted')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <Check size={16} />
              Terima
            </button>
            <button
              onClick={() => respondToInvitation(invitation, 'rejected')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-all"
            >
              <X size={16} />
              Tolak
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}