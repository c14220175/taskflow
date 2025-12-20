'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, Plus, UserPlus, Crown } from 'lucide-react'

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
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchTeams = async () => {
    try {
      // Check if teams table exists first
      const { data: tableCheck, error: tableError } = await supabase
        .from('teams')
        .select('count')
        .limit(1)
      
      if (tableError) {
        setTeams([])
        return
      }
      
      // Fetch teams yang dibuat oleh user (creator)
      const { data: createdTeams, error: createdError } = await supabase
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
      
      // Fetch teams yang user ikuti sebagai member
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams(*)
        `)
        .eq('user_id', userId)
      
      // Gabungkan teams
      const allTeams = [...(createdTeams || [])]
      if (memberTeams) {
        memberTeams.forEach(mt => {
          if (mt.teams && !allTeams.find(t => t.id === mt.teams.id)) {
            allTeams.push(mt.teams)
          }
        })
      }

      if (allTeams.length > 0) {
        // Fetch team members and leader info separately
        const teamsWithMembers = await Promise.all(
          allTeams.map(async (team) => {
            // Get team members
            const { data: members } = await supabase
              .from('team_members')
              .select(`
                user_id, role,
                profiles(full_name, email)
              `)
              .eq('team_id', team.id)
            
            // Get team leader (creator) info with fallback
            const { data: leaderProfile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', team.created_by)
              .single()
            
            return {
              ...team,
              team_members: members || [],
              leader_profile: {
                full_name: leaderProfile?.full_name || 'task0',
                email: leaderProfile?.email || 'unknown@email.com'
              }
            }
          })
        )
        
        setTeams(teamsWithMembers)
      } else {
        setTeams([])
      }
    } catch (error) {
      setTeams([])
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setLoading(true)
    
    try {
      // Create team (without description for now)
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          created_by: userId
        })
        .select()
        .single()

      if (teamError) {
        alert('Failed to create team: ' + teamError.message)
        return
      }

      // Add creator as admin
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'admin'
        })
        .select()

      if (memberError) {
        alert('Team created but failed to add you as admin: ' + memberError.message)
      } else {
        alert('Team created successfully!')
      }

      setNewTeamName('')
      setNewTeamDescription('')
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
      console.log('Inviting email:', inviteEmail.trim(), 'to team:', teamId)
      
      // Simplified approach - just send invitation without complex checks
      const { data: insertData, error: insertError } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          invited_email: inviteEmail.trim(),
          invited_by: userId,
          status: 'pending'
        })
        .select()

      console.log('Insert invitation result:', { insertData, insertError })

      if (insertError) {
        console.error('Insert error details:', insertError)
        alert('Failed to send invitation: ' + insertError.message)
        setLoading(false)
        return
      }

      alert('Invitation sent successfully!')
      setInviteEmail('')
      setShowInviteForm(null)
    } catch (error) {
      console.error('Invite error:', error)
      alert('Failed to send invitation.')
    }
    
    setLoading(false)
  }

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (deleteConfirmText !== teamName) {
      alert(`Please type "${teamName}" to confirm deletion.`)
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)
        .eq('created_by', userId) // Extra security check

      if (error) throw error

      alert('Team deleted successfully!')
      setShowDeleteConfirm(null)
      setDeleteConfirmText('')
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Team
          </button>
        </div>
      </div>

      {/* Create Team Form */}
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
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Team description feature coming soon</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invite Collaborator Form */}
      {showInviteForm && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-black mb-4">
            Invite Collaborator to "{teams.find(t => t.id === showInviteForm)?.name}"
          </h3>
          <form onSubmit={(e) => inviteCollaborator(e, showInviteForm)} className="space-y-4">
            <input
              type="email"
              placeholder="Collaborator email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Team Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-white p-4 rounded-lg shadow border border-red-200">
          <h3 className="font-semibold text-red-800 mb-4">Delete Team</h3>
          <p className="text-sm text-gray-600 mb-4">
            This action cannot be undone. This will permanently delete the team and remove all members.
          </p>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Type the team name to confirm:
          </p>
          <input
            type="text"
            placeholder={teams.find(t => t.id === showDeleteConfirm)?.name}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-black mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                const team = teams.find(t => t.id === showDeleteConfirm)
                if (team) deleteTeam(team.id, team.name)
              }}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Team'}
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(null)
                setDeleteConfirmText('')
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Teams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-black">{team.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Leader: {team.leader_profile?.full_name || team.leader_profile?.email || 'Unknown'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} />
                {team.team_members?.length || 0}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              Team ID: {team.id}
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
            </div>
            
            {/* Team Members */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Members:</h4>
              {team.team_members?.map((member) => (
                <div key={member.user_id} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    {member.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-gray-700">{member.profiles?.full_name || member.profiles?.email || 'Unknown User'}</span>
                  {member.role === 'admin' && (
                    <Crown size={12} className="text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>You're not part of any teams yet.</p>
          <p className="text-sm">Create a new team or join an existing one to get started!</p>
        </div>
      )}
    </div>
  )
}