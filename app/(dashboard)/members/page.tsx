'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Mail, UserX, Shield, MoreVertical, Search, Loader2, Send, UserCheck, Ban } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const mockMembers = [
  { id: '1', name: 'Alex Chen', email: 'alex@example.com', role: 'OWNER', status: 'ACTIVE', avatar: null, joinedAt: '2024-01-15', lastActive: '2 hours ago' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'ADMIN', status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', joinedAt: '2024-02-20', lastActive: '5 minutes ago' },
  { id: '3', name: 'Mike Rodriguez', email: 'mike@example.com', role: 'MEMBER', status: 'ACTIVE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', joinedAt: '2024-03-10', lastActive: '1 day ago' },
  { id: '4', name: 'Emily Davis', email: 'emily@example.com', role: 'MEMBER', status: 'ACTIVE', avatar: null, joinedAt: '2024-04-05', lastActive: '3 hours ago' },
  { id: '5', name: 'James Wilson', email: 'james@example.com', role: 'VIEWER', status: 'PENDING', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', joinedAt: '2024-05-01', lastActive: 'Never' },
]

const roleHierarchy = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
const roleColors = {
  OWNER: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  ADMIN: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  MEMBER: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  VIEWER: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
}

export default function MembersPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState(mockMembers)
  const [invitations, setInvitations] = useState([
    { id: '1', email: 'newuser@example.com', role: 'MEMBER', invitedAt: '2024-05-10', expiresAt: '2024-05-17' },
  ])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviting, setInviting] = useState(false)
  const [search, setSearch] = useState('')

  const currentUserRole = session?.memberships?.[0]?.role || 'VIEWER'
  const canManage = ['OWNER', 'ADMIN'].includes(currentUserRole)

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const canChangeRole = (targetRole: string) => {
    const currentIndex = roleHierarchy.indexOf(currentUserRole)
    const targetIndex = roleHierarchy.indexOf(targetRole)
    return targetIndex > currentIndex // Can only assign roles lower than own
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000))

      const newInvitation = {
        id: Date.now().toString(),
        email: inviteEmail,
        role: inviteRole,
        invitedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }
      setInvitations(prev => [...prev, newInvitation])
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteModal(false)
    } catch {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleResendInvite(invitationId: string) {
    try {
      await new Promise(r => setTimeout(r, 500))
      toast.success('Invitation resent')
    } catch {
      toast.error('Failed to resend invitation')
    }
  }

  async function handleRevokeInvite(invitationId: string) {
    if (!confirm('Revoke this invitation?')) return
    setInvitations(prev => prev.filter(i => i.id !== invitationId))
    toast.success('Invitation revoked')
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      await new Promise(r => setTimeout(r, 500))
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  async function handleRemoveMember(memberId: string) {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    if (!confirm(`Remove ${member.name} from the organization?`)) return

    try {
      await new Promise(r => setTimeout(r, 500))
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success(`${member.name} removed`)
    } catch {
      toast.error('Failed to remove member')
    }
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">Members</h1>
          <p className="text-sm text-fg-secondary">Manage team members and their access</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="hit-area press-scale inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors focus-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Invite Member
          </button>
        )}
      </div>

      {/* Search */}
      <div className="surface-1 rounded-xl border border-border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="hit-area w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
            aria-label="Search members"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="surface-1 rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-fg-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((member) => {
                const isCurrentUser = member.email === session?.user?.email
                const canEdit = canManage && !isCurrentUser && canChangeRole(member.role)
                const canRemove = canManage && !isCurrentUser && currentUserRole === 'OWNER'

                return (
                  <tr key={member.id} className="hover:bg-bg-secondary transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-medium image-outline">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="h-10 w-10 rounded-full image-outline" />
                          ) : (
                            getInitials(member.name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-fg-primary">{member.name}{isCurrentUser && ' (you)'}</p>
                          <p className="text-sm text-fg-secondary">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {canEdit ? (
                        <select
                          value={member.role}
                          onChange={e => handleChangeRole(member.id, e.target.value)}
                          className="hit-area-dense px-2 py-1 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                          aria-label={`Change role for ${member.name}`}
                        >
                          {roleHierarchy
                            .filter(r => canChangeRole(r))
                            .map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role as keyof typeof roleColors]}`}>
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                        member.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-fg-secondary">{member.joinedAt}</td>
                    <td className="px-6 py-4 text-sm text-fg-secondary">{member.lastActive}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <button className="hit-area p-2 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring" aria-label={`Edit ${member.name}`}>
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="hit-area p-2 rounded-lg text-error hover:bg-error-bg focus-ring"
                            aria-label={`Remove ${member.name}`}
                          >
                            <UserX className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-fg-muted">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="surface-1 rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fg-primary">Pending Invitations</h2>
            <span className="text-sm text-fg-muted">{invitations.length} pending</span>
          </div>
          <div className="divide-y divide-border">
            {invitations.map((invite) => (
              <div key={invite.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-medium">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-fg-primary">{invite.email}</p>
                    <p className="text-sm text-fg-secondary">
                      Role: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[invite.role as keyof typeof roleColors]}`}>{invite.role}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-fg-secondary">
                  <span>Expires: {invite.expiresAt}</span>
                  <button
                    onClick={() => handleResendInvite(invite.id)}
                    className="hit-area text-brand hover:underline focus-ring text-sm"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="hit-area text-error hover:underline focus-ring text-sm"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}