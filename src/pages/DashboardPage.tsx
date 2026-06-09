import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/states/LoadingState'
import { ErrorState } from '../components/states/ErrorState'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { getProjectYearFilterOptions } from '../features/projects/projectService'
import { listProjects } from '../features/projects/projectService'
import { listUserProfiles } from '../features/auth/profileService'
import { dashboardSummary } from '../features/dashboard/dashboardUtils'
import { useAppSelector } from '../hooks/useAppStore'
import { getAuthorizedRole } from '../lib/authz'
import { formatDate } from '../utils/date'
import type { ProjectRecord, ProjectStatus, UserProfile } from '../types'

type DashboardView = 'overview' | 'repository' | 'topic_checker' | 'insights'

export function DashboardPage() {
  const profile = useAppSelector((state) => state.profile.profile)
  const authorizedRole = getAuthorizedRole(profile)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | ProjectStatus>('all')
  const [yearFilter, setYearFilter] = useState<'all' | string>('all')
  const [supervisees, setSupervisees] = useState<UserProfile[]>([])
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [hoveredSummary, setHoveredSummary] = useState<'total' | 'approved' | 'pending' | 'rejected' | null>(null)
  const [pinnedSummary, setPinnedSummary] = useState<'total' | 'approved' | 'pending' | 'rejected' | null>(null)

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
      if (!profile || authorizedRole !== 'supervisor') {
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
  }, [authorizedRole, profile])

  const dashboardProjects = useMemo(() => {
    if (!profile) {
      return [] as ProjectRecord[]
    }

    return projects
  }, [profile, projects])

  const summary = useMemo(() => {
    if (!profile) {
      return null
    }

    return dashboardSummary(dashboardProjects, authorizedRole)
  }, [authorizedRole, dashboardProjects, profile])

  const yearOptions = useMemo(() => {
    return getProjectYearFilterOptions(dashboardProjects)
  }, [dashboardProjects])

  const visibleProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return [...dashboardProjects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .filter((project) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          project.title.toLowerCase().includes(normalizedSearch) ||
          project.supervisor.toLowerCase().includes(normalizedSearch) ||
          project.studentName.toLowerCase().includes(normalizedSearch)

        const matchesStatus =
          statusFilter === 'all'
          || (statusFilter === 'pending' ? project.status.startsWith('pending') : project.status === statusFilter)
        const matchesYear = yearFilter === 'all' || String(project.year) === yearFilter

        return matchesSearch && matchesStatus && matchesYear
      })
  }, [dashboardProjects, searchTerm, statusFilter, yearFilter])

  const pendingProjects = useMemo(() => {
    return visibleProjects.filter((project) => project.status.startsWith('pending'))
  }, [visibleProjects])

  const summaryPreviewProjects = useMemo(() => {
    const active = pinnedSummary

    if (active === 'approved') {
      return dashboardProjects.filter((project) => project.status === 'approved').slice(0, 4)
    }

    if (active === 'pending') {
      return dashboardProjects.filter((project) => project.status.startsWith('pending')).slice(0, 4)
    }

    if (active === 'rejected') {
      return dashboardProjects.filter((project) => project.status === 'rejected').slice(0, 4)
    }

    if (active === 'total') {
      return [...dashboardProjects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4)
    }

    return [] as ProjectRecord[]
  }, [dashboardProjects, pinnedSummary])

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
    pending_supervisor: 'border-amber-200 bg-amber-50 text-amber-700',
    pending_admin: 'border-amber-200 bg-amber-50 text-amber-700',
    rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  }

  function applyDashboardStatusFilter(nextStatus: 'all' | 'pending' | ProjectStatus) {
    setStatusFilter(nextStatus)
    setActiveView('repository')
  }

  const summaryCards = [
    {
      id: 'total' as const,
      label: 'Total Records',
      value: summary.total,
      helper: 'Click to preview all records',
      valueClassName: 'text-slate-950',
    },
    {
      id: 'approved' as const,
      label: 'Approved',
      value: summary.approved,
      helper: 'Click to preview approved records',
      valueClassName: 'text-emerald-700',
    },
    {
      id: 'pending' as const,
      label: 'Pending',
      value: summary.pending,
      helper: 'Click to preview the pending queue',
      valueClassName: 'text-amber-700',
    },
    {
      id: 'rejected' as const,
      label: 'Rejected',
      value: summary.rejected,
      helper: 'Click to preview rejected records',
      valueClassName: 'text-rose-700',
    },
  ]

  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Dashboard"
        title={`Welcome back, ${profile.fullName}`}
        description={
          authorizedRole === 'student'
            ? 'Track repository quality and browse recent records from a single command interface.'
            : authorizedRole === 'supervisor'
              ? 'Monitor submissions, spot review bottlenecks, and guide stronger topic direction.'
              : 'Oversee governance, active submissions, and repository operations at a glance.'
        }
      />

      <div className="relative">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const isPinned = pinnedSummary === card.id
            const isHovered = hoveredSummary === card.id
            return (
              <button
                key={card.id}
                type="button"
                aria-label={`${card.label} records — click to ${isPinned ? 'collapse' : 'expand'}`}
                aria-expanded={isPinned}
                onMouseEnter={() => setHoveredSummary(card.id)}
                onMouseLeave={() => setHoveredSummary((current) => (current === card.id ? null : current))}
                onFocus={() => setHoveredSummary(card.id)}
                onBlur={() => setHoveredSummary((current) => (current === card.id ? null : current))}
                onClick={() => {
                  setPinnedSummary((current) => (current === card.id ? null : card.id))
                }}
                style={{
                  outline: isPinned
                    ? '2.5px dashed #64748b'
                    : isHovered
                      ? '2.5px dashed #cbd5e1'
                      : '2.5px dashed transparent',
                  outlineOffset: '3px',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'outline-color 0.18s ease',
                }}
                className="text-left w-full focus-visible:outline-none"
              >
                <Card className="h-full p-5" hover>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                  <p className={`mt-2 text-3xl font-extrabold ${card.valueClassName}`}>{card.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
                  {(isHovered || isPinned) && (
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      {isPinned ? '▲ Click to collapse' : '▼ Click to expand'}
                    </p>
                  )}
                </Card>
              </button>
            )
          })}

        </div>

        {pinnedSummary ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {pinnedSummary === 'total' ? 'Latest repository records' : `${pinnedSummary[0].toUpperCase()}${pinnedSummary.slice(1)} records`}
                </p>
                <p className="mt-1 text-xs text-slate-500">Showing a preview — click any card to switch, or close to dismiss.</p>
              </div>
              <button
                type="button"
                onClick={() => setPinnedSummary(null)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {summaryPreviewProjects.length > 0 ? summaryPreviewProjects.map((project) => (
                <div key={project.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {project.studentName} | {project.supervisor} | {project.year}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusPillClass[project.status]}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500">No matching records are available for this status yet.</p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  applyDashboardStatusFilter(
                    pinnedSummary === 'total' ? 'all' : pinnedSummary
                  )
                  setPinnedSummary(null)
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View all in board
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {authorizedRole === 'supervisor' ? (
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

            {authorizedRole === 'admin' ? (
              <Link to="/upload-project">
                <Button size="sm" className="h-9 gap-1 bg-blue-600 px-3 text-white hover:bg-blue-500">
                  <Plus size={14} />
                  Add project
                </Button>
              </Link>
            ) : (
              <Link to={authorizedRole === 'supervisor' ? '/projects' : '/check-topic'}>
                <Button size="sm" variant="secondary">
                  Open workspace
                </Button>
              </Link>
            )}
          </div>
        </div>

          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'repository', label: 'Repository' },
              ...(authorizedRole === 'student' || authorizedRole === 'admin' ? [{ id: 'topic_checker', label: 'Topic Checker' }] : []),
              { id: 'insights', label: 'Insights' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeView === tab.id}
                onClick={() => setActiveView(tab.id as DashboardView)}
                className={
                  activeView === tab.id
                    ? 'inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold tracking-wide text-teal-800'
                    : 'inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
                }
              >
                {tab.label}
              </button>
            ))}
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
              onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | ProjectStatus)}
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
              {yearOptions.filter((option) => option.value !== 'all').map((year) => (
                <option key={year.value} value={year.value}>{year.label}</option>
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

          {activeView === 'overview' ? (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
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
                    {visibleProjects.slice(0, 8).map((project) => (
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

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Review queue</p>
                <p className="mt-2 text-sm text-slate-600">See exactly who is pending and jump into the matching record.</p>
                <div className="mt-4 space-y-3">
                  {pendingProjects.slice(0, 5).map((project) => (
                    <div key={project.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {project.studentName} | {project.supervisor}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusPillClass[project.status]}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 underline-offset-2 hover:underline"
                      >
                        Open record
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  ))}
                  {pendingProjects.length === 0 ? (
                    <p className="text-sm text-slate-500">No pending records are visible in the current view.</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeView === 'repository' ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Repository quick view</p>
                  <p className="mt-1 text-xs text-slate-500">Use the dashboard filters here, then open the full repository for wider inspection.</p>
                </div>
                <Link to="/projects" className="text-xs font-semibold text-slate-700 underline-offset-2 hover:underline">
                  View full repository
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {visibleProjects.slice(0, 6).map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {project.studentName} | {project.supervisor} | {project.year}
                        </p>
                      </div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Open
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeView === 'topic_checker' ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
              <p className="text-sm font-semibold text-slate-950">Topic checker workspace</p>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Move into the topic checker when you need semantic comparisons, prior-context retrieval, and rejection-aware iteration support.
              </p>
              <Link to="/check-topic" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
                Open topic checker
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : null}

          {activeView === 'insights' ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pending share</p>
                <p className="mt-2 text-3xl font-extrabold text-amber-700">
                  {summary.total > 0 ? Math.round((summary.pending / summary.total) * 100) : 0}%
                </p>
                <p className="mt-1 text-xs text-slate-500">Of currently visible records still awaiting review.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Approval share</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                  {summary.total > 0 ? Math.round((summary.approved / summary.total) * 100) : 0}%
                </p>
                <p className="mt-1 text-xs text-slate-500">Records already available for reference.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rejected share</p>
                <p className="mt-2 text-3xl font-extrabold text-rose-700">
                  {summary.total > 0 ? Math.round((summary.rejected / summary.total) * 100) : 0}%
                </p>
                <p className="mt-1 text-xs text-slate-500">Records requiring major rework before approval.</p>
              </div>
            </div>
          ) : null}

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
