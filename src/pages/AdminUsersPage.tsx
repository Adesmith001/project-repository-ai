import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/states/LoadingState'
import { ErrorState } from '../components/states/ErrorState'
import { EmptyState } from '../components/states/EmptyState'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Badge } from '../components/ui/Badge'
import { listUserProfiles } from '../features/auth/profileService'
import { Button } from '../components/ui/Button'
import { formatDate } from '../utils/date'
import type { UserProfile } from '../types'

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserProfile['role']>('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

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

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.department))).sort((a, b) => a.localeCompare(b))
  }, [users])

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return users
      .filter((user) => {
        const bySearch =
          query.length === 0 ||
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.department.toLowerCase().includes(query)

        const byRole = roleFilter === 'all' || user.role === roleFilter
        const byDepartment = departmentFilter === 'all' || user.department === departmentFilter

        return bySearch && byRole && byDepartment
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [users, searchTerm, roleFilter, departmentFilter])

  const hasActiveFilters = searchTerm.trim().length > 0 || roleFilter !== 'all' || departmentFilter !== 'all'

  const roleTone: Record<UserProfile['role'], 'default' | 'accent' | 'success'> = {
    student: 'default',
    supervisor: 'accent',
    admin: 'success',
  }

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
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Admin"
        title="User administration"
        description="Role and profile oversight for students, supervisors, and administrators."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total users</p>
            <UsersRound size={16} className="text-blue-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{users.length}</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Students</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{users.filter((user) => user.role === 'student').length}</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Supervisors</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{users.filter((user) => user.role === 'supervisor').length}</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Admins</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{users.filter((user) => user.role === 'admin').length}</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0" hover>
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">User management</h2>
              <p className="mt-1 text-sm text-slate-500">Search and filter users by role or department.</p>
            </div>
            <Badge>{filteredUsers.length} visible</Badge>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <SlidersHorizontal size={14} className="text-slate-500" />
            Filters
          </div>

          <div className="control-strip control-strip-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, email, department"
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as 'all' | UserProfile['role'])}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10"
              onClick={() => {
                setSearchTerm('')
                setDepartmentFilter('all')
                setRoleFilter('all')
              }}
              disabled={!hasActiveFilters}
            >
              Reset
            </Button>
          </div>

          <div className="table-shell">
            <table className="table-ui">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uid}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                        <p className="font-semibold text-slate-900">{user.fullName}</p>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.department}</td>
                    <td>
                      <Badge tone={roleTone[user.role]} className="capitalize">{user.role}</Badge>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}

                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-sm text-slate-500">No users match the current filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
