import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/states/LoadingState'
import { ErrorState } from '../components/states/ErrorState'
import { EmptyState } from '../components/states/EmptyState'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Badge } from '../components/ui/Badge'
import { listUserProfiles } from '../features/auth/profileService'
import type { UserProfile } from '../types'

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadUsers() {
      try {
        const records = await listUserProfiles()

        if (mounted) {
          setUsers(records)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load users.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadUsers()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (users.length === 0) {
    return <EmptyState title="No users yet" description="Registered users will appear here." />
  }

  return (
    <div className="space-y-5 py-4">
      <SectionHeading
        eyebrow="Admin"
        title="User administration"
        description="Role and profile oversight for students, supervisors, and administrators."
      />

      <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-950">User directory</h2>
        <Badge>{users.length} users</Badge>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{user.fullName}</td>
                <td className="px-3 py-2 text-slate-700">{user.email}</td>
                <td className="px-3 py-2 text-slate-700">{user.department}</td>
                <td className="px-3 py-2 capitalize text-slate-700">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </Card>
    </div>
  )
}
