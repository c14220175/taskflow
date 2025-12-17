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
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [joinTeamId, setJoinTeamId] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          user_id,
          role,
          profiles (
            full_name,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (data) setTeams(data)
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setLoading(true)
    
    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          description: newTeamDescription.trim(),
          created_by: userId
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'admin'
        })

      if (memberError) throw memberError

      setNewTeamName('')
      setNewTeamDescription('')
      setShowCreateForm(false)
      fetchTeams()
    } catch (error) {
      console.error('Error creating team:', error)
      alert('Failed to create team')
    }
    
    setLoading(false)
  }

  const joinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinTeamId.trim()) return

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: joinTeamId.trim(),
          user_id: userId,
          role: 'member'
        })

      if (error) throw error

      setJoinTeamId('')
      setShowJoinForm(false)
      fetchTeams()
    } catch (error) {
      console.error('Error joining team:', error)
      alert('Failed to join team. Please check the team ID.')
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
          <button
            onClick={() => setShowJoinForm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <UserPlus size={16} />
            Join Team
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
            <textarea
              placeholder="Team description (optional)"
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              rows={3}
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

      {/* Join Team Form */}
      {showJoinForm && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-black mb-4">Join Existing Team</h3>
          <form onSubmit={joinTeam} className="space-y-4">
            <input
              type="text"
              placeholder="Team ID"
              value={joinTeamId}
              onChange={(e) => setJoinTeamId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-black"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
              <button
                type="button"
                onClick={() => setShowJoinForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
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
                {team.description && (
                  <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} />
                {team.team_members?.length || 0}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              Team ID: {team.id}
            </div>
            
            {/* Team Members */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Members:</h4>
              {team.team_members?.map((member) => (
                <div key={member.user_id} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    {member.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-gray-700">{member.profiles?.full_name || 'Unknown'}</span>
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