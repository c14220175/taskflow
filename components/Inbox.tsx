'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Mail, Check, X } from 'lucide-react'

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
  const supabase = createClient()

  const fetchInvitations = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const respondToInvitation = async (invitationId: string, response: 'accepted' | 'rejected') => {
    setLoading(true)
    
    try {
      // Update invitation status
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ 
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) throw updateError

      // If accepted, add to team_members
      if (response === 'accepted') {
        const invitation = invitations.find(inv => inv.id === invitationId)
        if (invitation) {
          const { error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: invitation.team_id,
              user_id: userId,
              role: 'member'
            })

          if (memberError) throw memberError
        }
      }

      alert(response === 'accepted' ? 'Invitation accepted!' : 'Invitation rejected.')
      fetchInvitations() // Refresh list
    } catch (error) {
      alert('Failed to respond to invitation.')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchInvitations()
  }, [userEmail])

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Mail size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No pending invitations</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-black">Team Invitations</h3>
      
      {invitations.map((invitation) => (
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
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => respondToInvitation(invitation.id, 'accepted')}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={14} />
              Accept
            </button>
            <button
              onClick={() => respondToInvitation(invitation.id, 'rejected')}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              <X size={14} />
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}