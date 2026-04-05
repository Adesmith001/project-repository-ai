import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/states/LoadingState'
import { ErrorState } from '../components/states/ErrorState'
import { listProjects } from '../features/projects/projectService'
import { dashboardSummary } from '../features/dashboard/dashboardUtils'
import { useAppSelector } from '../hooks/useAppStore'
import type { ProjectRecord } from '../types'

export function DashboardPage() {
  const profile = useAppSelector((state) => state.profile.profile)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const summary = useMemo(() => {
    if (!profile) {
      return null
    }

    return dashboardSummary(projects, profile.role)
  }, [projects, profile])

  if (loading) {
    return <LoadingState label="Loading dashboard..." />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!summary || !profile) {
    return <ErrorState message="Profile not available for dashboard." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Welcome, {profile.fullName}</h2>
        <p className="text-sm text-slate-600">
          {profile.role === 'student' && 'Review previous projects before finalizing your topic.'}
          {profile.role === 'supervisor' && 'Track project quality and supervise originality checks.'}
          {profile.role === 'admin' && 'Manage users, projects, and quality assurance workflows.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Projects</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.total}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.approved}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.pending}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Rejected</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.rejected}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/projects"
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Browse repository
          </Link>

          {(profile.role === 'student' || profile.role === 'admin') && (
            <Link
              to="/check-topic"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Check topic originality
            </Link>
          )}

          {profile.role === 'admin' && (
            <Link
              to="/upload-project"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Upload project
            </Link>
          )}
        </div>
      </Card>
    </div>
  )
}
