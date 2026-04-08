import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { getProjectById } from '../features/projects/projectService'
import { formatDate } from '../utils/date'
import type { ProjectRecord } from '../types'

export function ProjectDetailPage() {
  const { id } = useParams()
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProject() {
      if (!id) {
        setError('Project ID is missing.')
        setLoading(false)
        return
      }

      try {
        const record = await getProjectById(id)

        if (mounted) {
          setProject(record)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load project.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadProject()

    return () => {
      mounted = false
    }
  }, [id])

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!project) {
    return <EmptyState title="Project not found" description="The selected project record does not exist." />
  }

  return (
    <div className="space-y-5 py-4">
      <SectionHeading
        eyebrow="Project Detail"
        title="Repository record"
        description="Review metadata, abstract depth, and source document for this project."
      />

      <Card className="p-6" hover>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">{project.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {project.department} | {project.year} | Supervisor: {project.supervisor}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
            {project.status}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Student</p>
            <p className="text-sm text-slate-800">{project.studentName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
            <p className="text-sm text-slate-800">{formatDate(project.createdAt)}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Abstract</p>
          <p className="mt-2 text-sm leading-6 text-slate-800">{project.abstract}</p>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Keywords</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {project.status === 'rejected' && project.rejectionReason.trim() ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs uppercase tracking-wide text-rose-700">Rejection reason</p>
            <p className="mt-2 text-sm text-rose-900">{project.rejectionReason}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <a href={project.fileUrl} target="_blank" rel="noreferrer">
            <Button>Open PDF</Button>
          </a>
          <Link to="/projects">
            <Button variant="secondary">Back to repository</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
