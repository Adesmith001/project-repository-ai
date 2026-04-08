import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/states/LoadingState'
import { ErrorState } from '../components/states/ErrorState'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { listProjects } from '../features/projects/projectService'
import { listUserProfiles } from '../features/auth/profileService'
import { dashboardSummary } from '../features/dashboard/dashboardUtils'
import { useAppSelector } from '../hooks/useAppStore'
import { formatDate } from '../utils/date'
import type { ProjectRecord, ProjectStatus, UserProfile } from '../types'

export function DashboardPage() {
  const profile = useAppSelector((state) => state.profile.profile)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')
  const [yearFilter, setYearFilter] = useState<'all' | string>('all')
  const [supervisees, setSupervisees] = useState<UserProfile[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const records = await listProjects()

        if (mounted) {
          setProjects(records)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard metrics.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadSupervisees() {
      if (!profile || profile.role !== 'supervisor') {
        if (mounted) {
          setSupervisees([])
        }
        return
      }

      try {
        const users = await listUserProfiles()

        if (mounted) {
          setSupervisees(
            users
              .filter((user) => user.role === 'student' && user.assignedSupervisorUid === profile.uid)
              .sort((a, b) => a.fullName.localeCompare(b.fullName)),
          )
        }
      } catch {
        if (mounted) {
          setSupervisees([])
        }
      }
    }

    void loadSupervisees()

    return () => {
      mounted = false
    }
  }, [profile])

  const summary = useMemo(() => {
    if (!profile) {
      return null
    }

    return dashboardSummary(projects, profile.role)
  }, [projects, profile])

  const yearOptions = useMemo(() => {
    return Array.from(new Set(projects.map((project) => String(project.year)))).sort((a, b) => Number(b) - Number(a))
  }, [projects])

  const visibleProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter((project) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          project.title.toLowerCase().includes(normalizedSearch) ||
          project.supervisor.toLowerCase().includes(normalizedSearch) ||
          project.studentName.toLowerCase().includes(normalizedSearch)

        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        const matchesYear = yearFilter === 'all' || String(project.year) === yearFilter

        return matchesSearch && matchesStatus && matchesYear
      })
  }, [projects, searchTerm, statusFilter, yearFilter])

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!summary || !profile) {
    return <ErrorState message="Profile not available for dashboard." />
  }

  const statusPillClass: Record<ProjectStatus, string> = {
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Dashboard"
        title={`Welcome back, ${profile.fullName}`}
        description={
          profile.role === 'student'
            ? 'Track repository quality and browse recent records from a single command interface.'
            : profile.role === 'supervisor'
              ? 'Monitor submissions, spot review bottlenecks, and guide stronger topic direction.'
              : 'Oversee governance, active submissions, and repository operations at a glance.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total Records</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{summary.total}</p>
          <p className="mt-1 text-xs text-slate-500">All projects in repository</p>
        </Card>
        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">{summary.approved}</p>
          <p className="mt-1 text-xs text-slate-500">Ready for reference</p>
        </Card>
        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-700">{summary.pending}</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting review</p>
        </Card>
        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Rejected</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-700">{summary.rejected}</p>
          <p className="mt-1 text-xs text-slate-500">Needs significant changes</p>
        </Card>
      </div>

      {profile.role === 'supervisor' ? (
        <Card className="p-5" hover>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">My supervisees</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{supervisees.length}</p>
              <p className="mt-1 text-xs text-slate-500">Students assigned to your supervision roster</p>
            </div>
            <Link to="/admin/users">
              <Button size="sm" variant="outline">Manage supervisees</Button>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {supervisees.length > 0 ? supervisees.slice(0, 8).map((student) => (
              <span
                key={student.uid}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
              >
                {student.fullName}
              </span>
            )) : (
              <p className="text-sm text-slate-500">No students are assigned to you yet.</p>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0" hover>
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold text-slate-950">Smart repository board</h3>
              <p className="mt-1 text-sm text-slate-500">Track records, status movement, and review readiness in one place.</p>
            </div>

            {profile.role === 'admin' ? (
              <Link to="/upload-project">
                <Button size="sm" className="h-9 gap-1 bg-blue-600 px-3 text-white hover:bg-blue-500">
                  <Plus size={14} />
                  Add project
                </Button>
              </Link>
            ) : (
              <Link to={profile.role === 'supervisor' ? '/projects' : '/check-topic'}>
                <Button size="sm" variant="secondary">
                  Open workspace
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Overview</Badge>
            <Badge tone="default">Repository</Badge>
            {(profile.role === 'student' || profile.role === 'admin') && <Badge tone="default">Topic Checker</Badge>}
            <Badge tone="default">Insights</Badge>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.3fr_repeat(3,minmax(0,0.7fr))]">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, student, supervisor"
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | ProjectStatus)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="all">All Years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-230 w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project ID</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Supervisor</th>
                  <th className="px-4 py-3 font-semibold">Year</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleProjects.slice(0, 12).map((project) => (
                  <tr key={project.id} className="border-t border-slate-100 text-slate-700">
                    <td className="px-4 py-3 text-xs text-slate-500">{project.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <p className="max-w-55 truncate font-semibold text-slate-900">{project.title}</p>
                      <p className="text-xs text-slate-500">{project.department}</p>
                    </td>
                    <td className="px-4 py-3">{project.studentName}</td>
                    <td className="px-4 py-3">{project.supervisor}</td>
                    <td className="px-4 py-3">{project.year}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusPillClass[project.status]}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(project.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Open
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}

                {visibleProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                      No records match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <p>Showing {Math.min(visibleProjects.length, 12)} of {visibleProjects.length} filtered records</p>
            <Link to="/projects" className="font-semibold text-slate-700 underline-offset-2 hover:underline">
              View full repository
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
