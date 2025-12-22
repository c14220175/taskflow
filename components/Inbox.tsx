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
    if (!userEmail) return

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('invited_email', userEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        const enrichedInvitations = await Promise.all(
          data.map(async (invitation) => {
            const { data: teamData } = await supabase
              .from('teams')
              .select('name')
              .eq('id', invitation.team_id)
              .maybeSingle()

            const { data: inviterData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', invitation.invited_by)
              .maybeSingle()

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
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) throw updateError

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

      fetchInvitations()
    } catch (error) {
      alert('Failed to respond to invitation.')
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchInvitations()

    if (!userEmail) return

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen Insert, Update, Delete
          schema: 'public',
          table: 'team_invitations',
          filter: `invited_email=eq.${userEmail}` // HANYA dengarkan invite untuk email saya
        },
        (payload) => {
          console.log('Realtime Inbox update:', payload)
          fetchInvitations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
        <div key={invitation.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
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
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Check size={14} />
              Accept
            </button>
            <button
              onClick={() => respondToInvitation(invitation.id, 'rejected')}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
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