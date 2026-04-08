import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { useDepartments } from '../hooks/useDepartments'
import { removeProject, listProjects, updateProjectStatus } from '../features/projects/projectService'
import { resetProjectFilters, setProjectFilter } from '../features/projects/projectFilterSlice'
import { formatDate } from '../utils/date'
import type { ProjectRecord } from '../types'

export function ProjectsPage() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.projectFilters.filters)
  const profile = useAppSelector((state) => state.profile.profile)
  const { departments } = useDepartments()

  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionProjectId, setActionProjectId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadProjects() {
      try {
        setLoading(true)
        const [records, allRecords] = await Promise.all([listProjects(filters), listProjects()])

        if (mounted) {
          setProjects(records)
          setAllProjects(allRecords)
          setError('')
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load projects.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      mounted = false
    }
  }, [filters])

  async function onDelete(projectId: string) {
    if (!window.confirm('Delete this project permanently?')) {
      return
    }

    try {
      await removeProject(projectId)
      const refreshed = await listProjects(filters)
      setProjects(refreshed)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete project.')
    }
  }

  function canSupervisorReview(project: ProjectRecord) {
    if (!profile || profile.role !== 'supervisor') {
      return false
    }

    const hasUidMatch = project.supervisorUid.trim().length > 0 && project.supervisorUid === profile.uid
    const hasNameMatch = project.supervisor.trim().toLowerCase() === profile.fullName.trim().toLowerCase()

    return hasUidMatch || hasNameMatch
  }

  async function onReview(project: ProjectRecord, nextStatus: ProjectRecord['status']) {
    if (!profile || (profile.role !== 'supervisor' && profile.role !== 'admin')) {
      return
    }

    try {
      setActionProjectId(project.id)

      await updateProjectStatus({
        projectId: project.id,
        status: nextStatus,
        actor: {
          uid: profile.uid,
          fullName: profile.fullName,
          role: profile.role,
        },
      })

      const refreshed = await listProjects(filters)
      setProjects(refreshed)
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to update review status.')
    } finally {
      setActionProjectId(null)
    }
  }

  const supervisorOptions = useMemo(() => {
    const uniqueSupervisors = Array.from(new Set(allProjects.map((item) => item.supervisor)))
    return [{ value: 'all', label: 'All Supervisors' }, ...uniqueSupervisors.map((item) => ({ value: item, label: item }))]
  }, [allProjects])

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(allProjects.map((item) => item.year))).sort((a, b) => b - a)
    return [{ value: 'all', label: 'All Years' }, ...years.map((item) => ({ value: String(item), label: String(item) }))]
  }, [allProjects])

  const statusMeta: Record<ProjectRecord['status'], { tone: 'success' | 'warning' | 'default'; label: string }> = {
    approved: { tone: 'success', label: 'Approved' },
    pending: { tone: 'warning', label: 'Pending' },
    rejected: { tone: 'default', label: 'Rejected' },
  }

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.department !== 'all' ||
    filters.year !== 'all' ||
    filters.supervisor !== 'all' ||
    filters.status !== 'all'

  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Repository"
        title="Explore institutional project intelligence"
        description="Filter and inspect previous project records before deciding on topic direction."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Visible records</p>
            <FolderKanban size={16} className="text-teal-700" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{projects.length}</p>
          <p className="mt-1 text-xs text-slate-500">Current repository result set</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">
            {projects.filter((project) => project.status === 'approved').length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Ready for reference and supervision</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-700">
            {projects.filter((project) => project.status === 'pending').length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Awaiting institutional review</p>
        </Card>

        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">AI REPO hint</p>
            <Sparkles size={16} className="text-teal-700" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">Use keyword + department filters first.</p>
          <p className="mt-1 text-xs text-slate-500">This usually narrows to the most relevant historical context quickly.</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Project repository</h2>
            <p className="mt-1 text-sm text-slate-600">Refine the dataset and inspect records with cleaner supervision context.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{projects.length} visible</Badge>
            {hasActiveFilters ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  dispatch(resetProjectFilters())
                }}
              >
                Reset filters
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <SlidersHorizontal size={14} className="text-teal-700" />
          Filter controls
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Search"
            placeholder="Title, abstract, keyword"
            value={filters.search}
            onChange={(event) =>
              dispatch(
                setProjectFilter({
                  key: 'search',
                  value: event.target.value,
                }),
              )
            }
          />

          <Select
            label="Department"
            options={[
              { value: 'all', label: 'All Departments' },
              ...departments.map((item) => ({ value: item, label: item })),
            ]}
            value={filters.department}
            onChange={(event) => dispatch(setProjectFilter({ key: 'department', value: event.target.value }))}
          />

          <Select
            label="Year"
            options={yearOptions}
            value={filters.year}
            onChange={(event) => dispatch(setProjectFilter({ key: 'year', value: event.target.value }))}
          />

          <Select
            label="Supervisor"
            options={supervisorOptions}
            value={filters.supervisor}
            onChange={(event) => dispatch(setProjectFilter({ key: 'supervisor', value: event.target.value }))}
          />

          <Select
            label="Status"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'approved', label: 'Approved' },
              { value: 'pending', label: 'Pending' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={filters.status}
            onChange={(event) => dispatch(setProjectFilter({ key: 'status', value: event.target.value }))}
          />
        </div>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try changing your filters or add a new project record."
        />
      ) : null}

      {!loading && !error && projects.length > 0 ? (
        <Card className="overflow-hidden p-0" hover>
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-extrabold text-slate-950">Repository records</h3>
            <p className="mt-1 text-sm text-slate-500">Detailed list view for scanning titles, ownership, and review state.</p>
          </div>

          <div className="table-shell">
            <table className="table-ui">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Title</th>
                  <th>Supervisor</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="text-xs text-slate-500">{project.id.slice(0, 8)}</td>
                    <td>
                      <div>
                        <Link to={`/projects/${project.id}`} className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                          {project.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">{project.department} | {project.studentName}</p>
                      </div>
                    </td>
                    <td>{project.supervisor}</td>
                    <td>{project.year}</td>
                    <td>
                      <Badge tone={statusMeta[project.status].tone}>{statusMeta[project.status].label}</Badge>
                    </td>
                    <td>{formatDate(project.updatedAt)}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/projects/${project.id}`}>
                          <Button size="sm" variant="outline">Open</Button>
                        </Link>
                        {profile?.role === 'supervisor' && canSupervisorReview(project) ? (
                          <>
                            {project.status !== 'approved' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={actionProjectId === project.id}
                                onClick={() => void onReview(project, 'approved')}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {project.status !== 'rejected' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionProjectId === project.id}
                                onClick={() => void onReview(project, 'rejected')}
                              >
                                Reject
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                        {profile?.role === 'admin' ? (
                          <>
                            {project.status === 'pending' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={actionProjectId === project.id}
                                onClick={() => void onReview(project, 'approved')}
                              >
                                Approve
                              </Button>
                            ) : null}
                            <Link to={`/upload-project?edit=${project.id}`}>
                              <Button size="sm" variant="secondary">Edit</Button>
                            </Link>
                            <Button size="sm" variant="danger" onClick={() => void onDelete(project.id)}>
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
