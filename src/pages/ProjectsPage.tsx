import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FolderKanban, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { SectionHeading } from '../components/ui/SectionHeading'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { useDepartments } from '../hooks/useDepartments'
import { useErrorToast } from '../hooks/useErrorToast'
import { canUseSupervisorMode, getAuthorizedRole } from '../lib/authz'
import { findProjectDuplicates } from '../features/projects/duplicateService'
import { removeProject, listProjects, updateProjectStatus } from '../features/projects/projectService'
import { getProjectYearFilterOptions, getSupervisorFilterOptions } from '../features/projects/projectService'
import { resetProjectFilters, setProjectFilter } from '../features/projects/projectFilterSlice'
import { formatDate } from '../utils/date'
import { AREAS } from '../lib/constants'
import type { ProjectRecord } from '../types'

export function ProjectsPage() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.projectFilters.filters)
  const profile = useAppSelector((state) => state.profile.profile)
  const authorizedRole = getAuthorizedRole(profile)
  const { departments } = useDepartments()

  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionProjectId, setActionProjectId] = useState<string | null>(null)
  const [rejectingProject, setRejectingProject] = useState<ProjectRecord | null>(null)
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState('')
  const [rejectionError, setRejectionError] = useState('')
  const [searchParams] = useSearchParams()

  useErrorToast(rejectionError)

  useEffect(() => {
    const urlFilters = {
      search: searchParams.get('search'),
      department: searchParams.get('department'),
      area: searchParams.get('area'),
      year: searchParams.get('year'),
      supervisor: searchParams.get('supervisor'),
      status: searchParams.get('status'),
    } as const

    for (const [key, value] of Object.entries(urlFilters)) {
      if (!value || filters[key as keyof typeof urlFilters] === value) {
        continue
      }

      dispatch(
        setProjectFilter({
          key: key as keyof typeof urlFilters,
          value,
        }),
      )
    }
  }, [dispatch, filters, searchParams])

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
      const [refreshed, refreshedAll] = await Promise.all([listProjects(filters), listProjects()])
      setProjects(refreshed)
      setAllProjects(refreshedAll)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete project.')
    }
  }

  function canSupervisorReview(project: ProjectRecord) {
    if (!profile || authorizedRole !== 'supervisor' || !canUseSupervisorMode(profile)) {
      return false
    }

    return project.supervisorUid.trim().length > 0 && project.supervisorUid === profile.uid
  }

  async function onReview(project: ProjectRecord, nextStatus: ProjectRecord['status'], rejectionReason?: string) {
    if (!profile || (authorizedRole !== 'supervisor' && authorizedRole !== 'admin')) {
      return
    }

    try {
      setActionProjectId(project.id)

      await updateProjectStatus({
        projectId: project.id,
        status: nextStatus,
        rejectionReason,
        actor: {
          uid: profile.uid,
          fullName: profile.fullName,
          role: authorizedRole,
          email: profile.email,
          staffId: profile.staffId,
        },
      })

      const refreshed = await listProjects(filters)
      setProjects(refreshed)

      if (nextStatus === 'rejected') {
        setRejectingProject(null)
        setRejectionReasonDraft('')
        setRejectionError('')
      }
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to update review status.')
    } finally {
      setActionProjectId(null)
    }
  }

  function openRejectModal(project: ProjectRecord) {
    setRejectingProject(project)
    setRejectionReasonDraft(project.rejectionReason || '')
    setRejectionError('')
  }

  function closeRejectModal() {
    if (actionProjectId) {
      return
    }

    setRejectingProject(null)
    setRejectionReasonDraft('')
    setRejectionError('')
  }

  async function submitRejectReason() {
    if (!rejectingProject) {
      return
    }

    const reason = rejectionReasonDraft.trim()

    if (reason.length < 10) {
      setRejectionError('Please provide a rejection reason with at least 10 characters.')
      return
    }

    await onReview(rejectingProject, 'rejected', reason)
  }

  const supervisorOptions = useMemo(() => {
    return getSupervisorFilterOptions(allProjects)
  }, [allProjects])

  const yearOptions = useMemo(() => getProjectYearFilterOptions(allProjects), [allProjects])
  const duplicateSummary = useMemo(() => findProjectDuplicates(allProjects), [allProjects])

  const statusMeta: Record<ProjectRecord['status'], { tone: 'success' | 'warning' | 'default'; label: string }> = {
    approved: { tone: 'success', label: 'Approved' },
    pending_supervisor: { tone: 'warning', label: 'Pending (Supervisor)' },
    pending_admin: { tone: 'warning', label: 'Pending (Admin)' },
    rejected: { tone: 'default', label: 'Rejected' },
  }

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.department !== 'all' ||
    filters.area !== 'all' ||
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
            {projects.filter((project) => project.status.startsWith('pending')).length}
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

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Input
            label="Search"
            placeholder="Title, abstract, keyword, supervisor, student"
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
            label="Area"
            options={[
              { value: 'all', label: 'All Areas' },
              ...AREAS.map((item) => ({ value: item, label: item })),
            ]}
            value={filters.area}
            onChange={(event) => dispatch(setProjectFilter({ key: 'area', value: event.target.value }))}
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
              { value: 'pending_supervisor', label: 'Pending (Supervisor)' },
              { value: 'pending_admin', label: 'Pending (Admin)' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={filters.status}
            onChange={(event) => dispatch(setProjectFilter({ key: 'status', value: event.target.value }))}
          />
        </div>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && authorizedRole === 'admin' ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950">Duplicate inspection</h3>
              <p className="mt-1 text-sm text-slate-500">Review exact-title duplicates and high-confidence near duplicates before deleting records.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{duplicateSummary.exactTitleGroups.length} exact-title groups</Badge>
              <Badge>{duplicateSummary.nearDuplicatePairs.length} near-duplicate pairs</Badge>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="soft-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Exact Title Matches</p>
              <div className="mt-3 space-y-3">
                {duplicateSummary.exactTitleGroups.length > 0 ? duplicateSummary.exactTitleGroups.slice(0, 5).map((group) => (
                  <div key={group.normalizedTitle} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">{group.projects[0]?.title || 'Untitled group'}</p>
                    <p className="mt-1 text-xs text-slate-500">{group.projects.length} records share this normalized title.</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No exact-title duplicates detected in the current repository set.</p>
                )}
              </div>
            </div>

            <div className="soft-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Near-Duplicate Suggestions</p>
              <div className="mt-3 space-y-3">
                {duplicateSummary.nearDuplicatePairs.length > 0 ? duplicateSummary.nearDuplicatePairs.slice(0, 5).map((pair) => (
                  <div key={`${pair.left.id}-${pair.right.id}`} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">{pair.left.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Similar to "{pair.right.title}" at {(pair.similarityScore * 100).toFixed(1)}%.
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No high-confidence near duplicates detected in the current repository set.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

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
                        <p className="mt-0.5 text-xs text-slate-500">{project.department} | {project.area} | {project.studentName}</p>
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
                        {authorizedRole === 'admin' ? (
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={actionProjectId === project.id}
                            onClick={() => void onDelete(project.id)}
                          >
                            Delete
                          </Button>
                        ) : null}
                        {authorizedRole === 'student' && project.studentUid === profile?.uid && project.status === 'rejected' ? (
                          <>
                            <Link to={`/upload-project?resubmitFrom=${project.id}`}>
                              <Button size="sm" variant="secondary">Resubmit</Button>
                            </Link>
                          </>
                        ) : null}
                        {authorizedRole === 'supervisor' && canSupervisorReview(project) ? (
                          <>
                            {project.status === 'pending_supervisor' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={actionProjectId === project.id}
                                onClick={() => void onReview(project, 'pending_admin')}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {project.status !== 'rejected' && project.status !== 'approved' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionProjectId === project.id}
                                onClick={() => openRejectModal(project)}
                              >
                                Reject
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                        {authorizedRole === 'admin' ? (
                          <>
                            {project.status === 'pending_admin' || project.status === 'pending_supervisor' ? (
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
                                onClick={() => openRejectModal(project)}
                              >
                                Reject
                              </Button>
                            ) : null}
                            <Link to={`/upload-project?edit=${project.id}`}>
                              <Button size="sm" variant="secondary">Edit</Button>
                            </Link>
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

      <Modal
        open={Boolean(rejectingProject)}
        onClose={closeRejectModal}
        title="Reject project"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Add a clear reason for rejection so the student can revise effectively.
          </p>

          <Textarea
            label="Rejection reason"
            value={rejectionReasonDraft}
            onChange={(event) => {
              setRejectionReasonDraft(event.target.value)
              if (rejectionError) {
                setRejectionError('')
              }
            }}
            placeholder="Explain what needs to be fixed before approval."
            required
          />

          {rejectionError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {rejectionError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={closeRejectModal}
              disabled={Boolean(actionProjectId)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void submitRejectReason()}
              disabled={Boolean(actionProjectId)}
            >
              {actionProjectId ? 'Saving...' : 'Confirm rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
