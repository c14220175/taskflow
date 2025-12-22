'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, Plus, Crown, UserX, AlertCircle } from 'lucide-react'

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
  const [removingMember, setRemovingMember] = useState<{ teamId: string, userId: string } | null>(null)
  const [newTeamName, setNewTeamName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchTeams = async () => {
    try {
      const { data: createdTeams } = await supabase
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name, created_by)')
        .eq('user_id', userId)

      const allTeamsMap = new Map()

      // Masukkan tim yang dibuat sendiri (Leader)
      if (createdTeams) {
        createdTeams.forEach((t) => allTeamsMap.set(t.id, t))
      }

      if (memberTeams) {
        memberTeams.forEach((mt: any) => {
          const teamData = Array.isArray(mt.teams) ? mt.teams[0] : mt.teams

          if (teamData && !allTeamsMap.has(teamData.id)) {
            allTeamsMap.set(teamData.id, teamData)
          }
        })
      }

      const uniqueTeams = Array.from(allTeamsMap.values())

      if (uniqueTeams.length > 0) {
        const teamsWithMembers = await Promise.all(
          uniqueTeams.map(async (team) => {
            const { data: members } = await supabase
              .from('team_members')
              .select(`
                user_id, role,
                profiles(full_name, email)
              `)
              .eq('team_id', team.id)

            const { data: leaderProfile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', team.created_by)
              .single()

            return {
              ...team,
              team_members: members || [],
              leader_profile: {
                full_name: leaderProfile?.full_name || leaderProfile?.email?.split('@')[0] || 'Unknown',
                email: leaderProfile?.email || ''
              }
            }
          })
        )

        teamsWithMembers.sort((a, b) => {
          if (a.created_by === userId && b.created_by !== userId) return -1;
          if (a.created_by !== userId && b.created_by === userId) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })

        setTeams(teamsWithMembers)
      } else {
        setTeams([])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      setTeams([])
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

      if (memberError) throw memberError

      alert('✅ Team created successfully!')
      setNewTeamName('')
      setShowCreateForm(false)
    } catch (error: any) {
      alert('❌ Failed to create team: ' + error.message)
    }

    setLoading(false)
  }

  const inviteCollaborator = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)

    try {
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('user_id, profiles(email)')
        .eq('team_id', teamId)

      const memberEmails = existingMember?.map((m: any) => {
        const profileData = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        return profileData?.email
      }).filter(Boolean) // Filter yang undefined/null

      if (memberEmails && memberEmails.some((email: string) => email?.toLowerCase() === inviteEmail.trim().toLowerCase())) {
        alert('❌ User is already a member of this team!')
        setLoading(false)
        return
      }

      const { data: pendingInvite } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', teamId)
        .eq('invited_email', inviteEmail.trim().toLowerCase())
        .eq('status', 'pending')
        .maybeSingle()

      if (pendingInvite) {
        alert('⚠️ There is already a pending invitation for this email!')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          invited_email: inviteEmail.trim().toLowerCase(),
          invited_by: userId,
          status: 'pending'
        })

      if (error) throw error

      alert('✅ Invitation sent successfully!')
      setInviteEmail('')
      setShowInviteForm(null)
    } catch (error: any) {
      alert('❌ Failed to send invitation: ' + error.message)
    }

    setLoading(false)
  }

  const removeMember = async (teamId: string, memberId: string) => {
    setLoading(true)

    try {
      const { data: assignedTasks } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('team_id', teamId)
        .eq('assigned_to', memberId)
        .neq('status', 'Done')

      if (assignedTasks && assignedTasks.length > 0) {
        alert(`❌ Cannot remove member! They still have ${assignedTasks.length} unfinished task(s).`)
        setRemovingMember(null)
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', memberId)

      if (error) throw error

      alert('✅ Member removed from team!')
      setRemovingMember(null)
    } catch (error: any) {
      alert('❌ Failed to remove member: ' + error.message)
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
        .eq('created_by', userId)

      if (error) throw error

      alert('✅ Team deleted successfully!')
      setShowDeleteConfirm(null)
      setDeleteConfirmText('')
    } catch (error: any) {
      alert('❌ Failed to delete team: ' + error.message)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchTeams()

    const teamsChannel = supabase
      .channel('teams-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          fetchTeams()
        }
      )
      .subscribe()

    const membersChannel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        () => {
          fetchTeams()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(teamsChannel)
      supabase.removeChannel(membersChannel)
    }
  }, [userId])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-black">My Teams</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-4 rounded-lg shadow border animate-in fade-in slide-in-from-top-4">
          <h3 className="font-semibold text-black mb-4">Create New Team</h3>
          <form onSubmit={createTeam} className="space-y-4">
            <input
              type="text"
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
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

      {showInviteForm && (
        <div className="bg-white p-4 rounded-lg shadow border animate-in fade-in slide-in-from-top-4">
          <h3 className="font-semibold text-black mb-4">
            Invite Member to "{teams.find(t => t.id === showInviteForm)?.name}"
          </h3>
          <form onSubmit={(e) => inviteCollaborator(e, showInviteForm)} className="space-y-4">
            <input
              type="email"
              placeholder="Member email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
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

      {showDeleteConfirm && (
        <div className="bg-white p-4 rounded-lg shadow border border-red-200 animate-in fade-in">
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
            className="w-full p-3 border border-gray-300 rounded-lg text-black mb-4 focus:ring-2 focus:ring-red-500 outline-none"
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

      {removingMember && (
        <div className="bg-white p-4 rounded-lg shadow border border-orange-200 animate-in fade-in">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-orange-600" size={20} />
            <h3 className="font-semibold text-orange-800">Remove Member</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to remove this member from the team? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => removeMember(removingMember.teamId, removingMember.userId)}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Removing...' : 'Remove Member'}
            </button>
            <button
              onClick={() => setRemovingMember(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white p-4 rounded-lg shadow border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-black text-lg">{team.name}</h3>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  {team.created_by === userId ? (
                    <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-xs">You are Leader</span>
                  ) : (
                    <span>Leader: {team.leader_profile?.full_name}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Users size={12} />
                {team.team_members?.length || 0}
              </div>
            </div>

            {team.created_by === userId && (
              <div className="mb-4 flex gap-3 text-xs border-b border-gray-100 pb-2">
                <button
                  onClick={() => setShowInviteForm(team.id)}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  + Invite Member
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(team.id)}
                  className="text-red-600 hover:text-red-800 font-medium hover:underline"
                >
                  Delete Team
                </button>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Members</h4>
              <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                {team.team_members?.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between text-sm group">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white ${member.role === 'admin' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        {member.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-800 font-medium text-xs">
                          {member.profiles?.full_name || member.profiles?.email}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {member.role === 'admin' ? 'Leader' : 'Member'}
                        </span>
                      </div>
                    </div>

                    {team.created_by === userId && member.user_id !== userId && (
                      <button
                        onClick={() => setRemovingMember({ teamId: team.id, userId: member.user_id })}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Remove member"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 font-medium">You're not part of any teams yet.</p>
          <p className="text-sm text-gray-500 mt-1">Create a new team or wait for an invitation!</p>
        </div>
      )}
    </div>
  )
}