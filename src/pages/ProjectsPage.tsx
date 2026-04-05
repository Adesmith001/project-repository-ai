import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { DEPARTMENTS } from '../lib/constants'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { removeProject, listProjects } from '../features/projects/projectService'
import { setProjectFilter } from '../features/projects/projectFilterSlice'
import { formatDate } from '../utils/date'
import type { ProjectRecord } from '../types'

export function ProjectsPage() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.projectFilters.filters)
  const profile = useAppSelector((state) => state.profile.profile)

  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const supervisorOptions = useMemo(() => {
    const uniqueSupervisors = Array.from(new Set(allProjects.map((item) => item.supervisor)))
    return [{ value: 'all', label: 'All Supervisors' }, ...uniqueSupervisors.map((item) => ({ value: item, label: item }))]
  }, [allProjects])

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(allProjects.map((item) => item.year))).sort((a, b) => b - a)
    return [{ value: 'all', label: 'All Years' }, ...years.map((item) => ({ value: String(item), label: String(item) }))]
  }, [allProjects])

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold text-slate-900">Project repository</h2>
        <p className="mt-1 text-sm text-slate-600">Browse past projects and analyze overlap with proposed ideas.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
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
              ...DEPARTMENTS.map((item) => ({ value: item, label: item })),
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

      {loading ? <LoadingState label="Loading projects..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try changing your filters or add a new project record."
        />
      ) : null}

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <Link to={`/projects/${project.id}`} className="text-lg font-semibold text-slate-900 underline">
                  {project.title}
                </Link>
                <p className="text-sm text-slate-600">
                  {project.department} | {project.year} | {project.supervisor}
                </p>
                <p className="line-clamp-2 text-sm text-slate-700">{project.abstract}</p>
                <p className="text-xs text-slate-500">Updated {formatDate(project.updatedAt)}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                  {project.status}
                </span>

                {profile?.role === 'admin' ? (
                  <>
                    <Link to={`/upload-project?edit=${project.id}`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button variant="danger" onClick={() => void onDelete(project.id)}>
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
