'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, Plus, UserPlus, Crown } from 'lucide-react'

// Definisi tipe data yang sudah disesuaikan
type Team = {
  id: string
  name: string
  description: string
  created_by: string
  created_at: string
  leader_profile?: {
    full_name: string
    email: string
  }
  team_members: {
    user_id: string
    role: string
    profiles: {
      full_name: string
      avatar_url: string
      email: string
    }
  }[]
}

type TeamManagementProps = {
  userId: string
}

export default function TeamManagement({ userId }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchTeams = async () => {
    try {
      setLoading(true)
      
      // Mengambil data tim dengan join profil leader dan member dalam satu query
      const { data: allTeamsData, error } = await supabase
        .from('teams')
        .select(`
          *,
          leader_profile:profiles!created_by (
            full_name,
            email
          ),
          team_members (
            user_id,
            role,
            profiles!user_id (
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Meratakan data (flattening) dari Array ke Object untuk mengatasi error TS2352
      const formattedTeams: Team[] = (allTeamsData || []).map((team: any) => ({
        ...team,
        leader_profile: Array.isArray(team.leader_profile) ? team.leader_profile[0] : team.leader_profile,
        team_members: (team.team_members || []).map((member: any) => ({
          ...member,
          profiles: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
        }))
      }))

      // Filter: Hanya tampilkan tim di mana user adalah pencipta ATAU anggota
      const filteredTeams = formattedTeams.filter(team => {
        const isCreator = team.created_by === userId
        const isMember = team.team_members?.some(m => m.user_id === userId)
        return isCreator || isMember
      })

      setTeams(filteredTeams)
    } catch (error: any) {
      console.error('Error fetching teams:', error.message)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setLoading(true)
    
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          created_by: userId
        })
        .select()
        .single()

      if (teamError) throw teamError

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'admin'
        })

      if (memberError) alert('Team created but failed to add you as admin.')
      else alert('Team created successfully!')

      setNewTeamName('')
      setShowCreateForm(false)
      fetchTeams()
    } catch (error) {
      alert('Failed to create team')
    }
    setLoading(false)
  }

  const inviteCollaborator = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setLoading(true)
    
    try {
<<<<<<< HEAD
      console.log('Inviting email:', inviteEmail.trim(), 'to team:', teamId)
      
      // Simplified approach - just send invitation without complex checks
      const { data: insertData, error: insertError } = await supabase
=======
      const emailToInvite = inviteEmail.trim().toLowerCase()

      const { error: insertError } = await supabase
>>>>>>> c91b13a6a13d9cf078eb2390c95a90e0fabd3826
        .from('team_invitations')
        .insert({
          team_id: teamId,
          invited_email: emailToInvite,
          invited_by: userId,
          status: 'pending'
        })
        .select()

<<<<<<< HEAD
      console.log('Insert invitation result:', { insertData, insertError })

      if (insertError) {
        console.error('Insert error details:', insertError)
        alert('Failed to send invitation: ' + insertError.message)
        setLoading(false)
        return
      }
=======
      if (insertError) throw insertError
>>>>>>> c91b13a6a13d9cf078eb2390c95a90e0fabd3826

      alert('Undangan berhasil dikirim ke ' + emailToInvite)
      setInviteEmail('')
      setShowInviteForm(null)
<<<<<<< HEAD
    } catch (error) {
      console.error('Invite error:', error)
      alert('Failed to send invitation.')
=======
    } catch (error: any) {
      alert('Gagal mengirim undangan: ' + error.message)
>>>>>>> c91b13a6a13d9cf078eb2390c95a90e0fabd3826
    }
    setLoading(false)
  }

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (deleteConfirmText !== teamName) {
      alert(`Please type "${teamName}" to confirm.`)
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('teams').delete().eq('id', teamId)
      if (error) throw error
      alert('Team deleted successfully!')
      setShowDeleteConfirm(null)
      fetchTeams()
    } catch (error) {
      alert('Failed to delete team.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-black">My Teams</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-black mb-4">Create New Team</h3>
          <form onSubmit={createTeam} className="space-y-4">
            <input
              type="text"
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              required
            />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showInviteForm && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-black mb-4">Invite Member</h3>
          <form onSubmit={(e) => inviteCollaborator(e, showInviteForm)} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              required
            />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Invite</button>
              <button type="button" onClick={() => setShowInviteForm(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Teams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-black">{team.name}</h3>
                {/* Baris "Leader:" telah dihapus dari sini sesuai permintaan */}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} />
                {team.team_members?.length || 0}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              Team ID: {team.id}
<<<<<<< HEAD
              {team.created_by === userId && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setShowInviteForm(team.id)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Invite Member
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(team.id)}
                    className="text-red-600 hover:text-red-800 underline"
                  >
                    Delete Team
                  </button>
                </div>
              )}
=======
              <div className="mt-2 flex gap-2">
                <button onClick={() => setShowInviteForm(team.id)} className="text-blue-600 underline">Invite Member</button>
                <button onClick={() => setShowDeleteConfirm(team.id)} className="text-red-600 underline">Delete Team</button>
              </div>
>>>>>>> c91b13a6a13d9cf078eb2390c95a90e0fabd3826
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Members:</h4>
              {team.team_members?.map((member) => (
                <div key={member.user_id} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-[10px]">
                    {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || 'U'}
                  </div>
                  <span className="text-gray-700">
                    {member.profiles?.full_name || member.profiles?.email}
                  </span>
                  {member.role === 'admin' && <Crown size={12} className="text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No teams found. Create one to get started!</p>
        </div>
      )}
    </div>
  )
}