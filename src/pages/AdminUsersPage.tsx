import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/states/LoadingState'
import { ErrorState } from '../components/states/ErrorState'
import { EmptyState } from '../components/states/EmptyState'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Badge } from '../components/ui/Badge'
import { listUserProfiles, setStudentUploadClearance, setUserRole } from '../features/auth/profileService'
import { createDepartment } from '../features/departments/departmentService'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { formatDate } from '../utils/date'
import { useAppSelector } from '../hooks/useAppStore'
import { useDepartments } from '../hooks/useDepartments'
import type { UserProfile } from '../types'

export function AdminUsersPage() {
  const profile = useAppSelector((state) => state.profile.profile)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserProfile['role']>('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserProfile['role']>>({})
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [newDepartment, setNewDepartment] = useState('')
  const [departmentActionError, setDepartmentActionError] = useState('')
  const [departmentActionInfo, setDepartmentActionInfo] = useState('')
  const [creatingDepartment, setCreatingDepartment] = useState(false)
  const { departments, loadingDepartments, refreshDepartments } = useDepartments()

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
    return departments
  }, [departments])

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

  async function onToggleStudentClearance(target: UserProfile) {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'supervisor')) {
      return
    }

    try {
      setActionUserId(target.uid)

      await setStudentUploadClearance({
        userId: target.uid,
        cleared: !target.uploadCleared,
        actorUid: profile.uid,
        actorName: profile.fullName,
      })

      setUsers((prev) =>
        prev.map((user) =>
          user.uid === target.uid
            ? {
                ...user,
                uploadCleared: !target.uploadCleared,
                clearedBySupervisorUid: !target.uploadCleared ? profile.uid : '',
                clearedBySupervisorName: !target.uploadCleared ? profile.fullName : '',
                clearanceUpdatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : user,
        ),
      )
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update student clearance.')
    } finally {
      setActionUserId(null)
    }
  }

  async function onAssignRole(target: UserProfile) {
    if (!profile || profile.role !== 'admin') {
      return
    }

    const nextRole = roleDrafts[target.uid] || target.role

    if (nextRole === target.role) {
      return
    }

    try {
      setActionUserId(target.uid)

      await setUserRole({
        userId: target.uid,
        role: nextRole,
        actorUid: profile.uid,
        actorName: profile.fullName,
      })

      const now = new Date().toISOString()

      setUsers((prev) =>
        prev.map((user) =>
          user.uid === target.uid
            ? {
                ...user,
                role: nextRole,
                uploadCleared: nextRole === 'student' ? false : true,
                clearedBySupervisorUid: nextRole === 'student' ? '' : profile.uid,
                clearedBySupervisorName: nextRole === 'student' ? '' : profile.fullName,
                clearanceUpdatedAt: now,
                updatedAt: now,
              }
            : user,
        ),
      )
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Unable to assign role.')
    } finally {
      setActionUserId(null)
    }
  }

  async function onCreateDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profile || profile.role !== 'admin') {
      return
    }

    const value = newDepartment.trim().replace(/\s+/g, ' ')

    if (value.length < 2 || value.length > 120) {
      setDepartmentActionError('Department name must be between 2 and 120 characters.')
      return
    }

    try {
      setCreatingDepartment(true)
      setDepartmentActionError('')
      setDepartmentActionInfo('')

      await createDepartment({
        name: value,
        actorUid: profile.uid,
      })

      await refreshDepartments()
      setNewDepartment('')
      setDepartmentActionInfo('Department created successfully.')
    } catch (createError) {
      setDepartmentActionError(createError instanceof Error ? createError.message : 'Unable to create department.')
    } finally {
      setCreatingDepartment(false)
    }
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

      {profile?.role === 'admin' ? (
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Department management</h2>
              <p className="mt-1 text-sm text-slate-500">Create additional departments used across onboarding and project records.</p>
            </div>
            <Badge>{departments.length} departments</Badge>
          </div>

          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={onCreateDepartment}>
            <Input
              label="New department"
              value={newDepartment}
              onChange={(event) => setNewDepartment(event.target.value)}
              placeholder="e.g. Electrical Engineering"
              required
            />
            <div className="flex items-end">
              <Button type="submit" size="lg" disabled={creatingDepartment || loadingDepartments}>
                {creatingDepartment ? 'Creating...' : 'Create department'}
              </Button>
            </div>
          </form>

          {departmentActionError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{departmentActionError}</p>
          ) : null}

          {departmentActionInfo ? (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{departmentActionInfo}</p>
          ) : null}
        </Card>
      ) : null}

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
                  <th>Upload Clearance</th>
                  <th>Joined</th>
                  <th>Role Assignment</th>
                  <th>Action</th>
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
                    <td>
                      {user.role === 'student' ? (
                        <Badge tone={user.uploadCleared ? 'success' : 'warning'}>
                          {user.uploadCleared ? 'Cleared' : 'Pending clearance'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-500">Not required</span>
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      {profile?.role === 'admin' ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={roleDrafts[user.uid] || user.role}
                            onChange={(event) =>
                              setRoleDrafts((prev) => ({
                                ...prev,
                                [user.uid]: event.target.value as UserProfile['role'],
                              }))
                            }
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
                            disabled={actionUserId === user.uid || profile.uid === user.uid}
                          >
                            <option value="student">Student</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Admin</option>
                          </select>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void onAssignRole(user)}
                            disabled={
                              actionUserId === user.uid
                              || profile.uid === user.uid
                              || (roleDrafts[user.uid] || user.role) === user.role
                            }
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Admin only</span>
                      )}
                    </td>
                    <td>
                      {user.role === 'student' ? (
                        <Button
                          size="sm"
                          variant={user.uploadCleared ? 'secondary' : 'outline'}
                          disabled={actionUserId === user.uid}
                          onClick={() => void onToggleStudentClearance(user)}
                        >
                          {user.uploadCleared ? 'Revoke' : 'Clear'}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-sm text-slate-500">No users match the current filters.</td>
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
