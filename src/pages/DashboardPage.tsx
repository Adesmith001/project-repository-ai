import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/states/LoadingState'
import { ErrorState } from '../components/states/ErrorState'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Modal } from '../components/ui/Modal'
import { listProjects } from '../features/projects/projectService'
import { dashboardSummary } from '../features/dashboard/dashboardUtils'
import { useAppSelector } from '../hooks/useAppStore'
import type { ProjectRecord } from '../types'

export function DashboardPage() {
  const profile = useAppSelector((state) => state.profile.profile)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openInsightModal, setOpenInsightModal] = useState(false)

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
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!summary || !profile) {
    return <ErrorState message="Profile not available for dashboard." />
  }

  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Dashboard"
        title={`Welcome back, ${profile.fullName}`}
        description={
          profile.role === 'student'
            ? 'Review repository context, validate originality, and sharpen your proposal before submission.'
            : profile.role === 'supervisor'
              ? 'Monitor project quality signals and guide students toward stronger research pathways.'
              : 'Oversee repository governance, uploads, and institutional quality controls.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card hover>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Projects</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{summary.total}</p>
        </Card>
        <Card hover>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Approved</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{summary.approved}</p>
        </Card>
        <Card hover>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{summary.pending}</p>
        </Card>
        <Card hover>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Rejected</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{summary.rejected}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="space-y-4" hover>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-extrabold text-slate-950">Main workspace</h3>
            <Badge tone="accent">Live repository context</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Link to="/projects" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">Browse project repository</p>
              <p className="mt-1 text-sm text-slate-600">Inspect department records, supervisors, and historical outcomes.</p>
            </Link>

            {(profile.role === 'student' || profile.role === 'admin') && (
              <Link to="/check-topic" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white">
                <p className="text-sm font-semibold text-slate-900">Check topic originality</p>
                <p className="mt-1 text-sm text-slate-600">Run semantic overlap analysis before committing your project scope.</p>
              </Link>
            )}

            {profile.role === 'admin' && (
              <Link to="/upload-project" className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white">
                <p className="text-sm font-semibold text-slate-900">Upload project records</p>
                <p className="mt-1 text-sm text-slate-600">Maintain institutional knowledge with curated PDF-backed metadata.</p>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpenInsightModal(true)}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-slate-900">Open strategic insights panel</p>
              <p className="mt-1 text-sm text-slate-600">Preview AI-readiness and originality posture for active users.</p>
            </button>
          </div>
        </Card>

        <Card hover>
          <h3 className="text-lg font-extrabold text-slate-950">Upload and input panel</h3>
          <p className="mt-2 text-sm text-slate-600">
            Project upload workflows are admin-governed. Students should use topic checking to refine before submission.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>• PDF-first repository structure</p>
            <p>• Metadata + embedding creation</p>
            <p>• Supervisor and status traceability</p>
          </div>
          {profile.role === 'admin' ? (
            <Link to="/upload-project" className="mt-5 inline-flex">
              <Button size="sm">Go to upload panel</Button>
            </Link>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card hover>
          <h3 className="text-lg font-extrabold text-slate-950">Recent repository activity</h3>
          <div className="mt-4 space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                <p className="mt-1 text-xs text-slate-600">{project.department} • {project.year} • {project.status}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card hover>
          <h3 className="text-lg font-extrabold text-slate-950">AI recommendation panel</h3>
          <p className="mt-2 text-sm text-slate-600">
            Use topic checker to generate novelty assessment, overlap explanation, alternatives, and research gaps.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>• Grounded to retrieved project context</p>
            <p>• Structured results for supervision meetings</p>
            <p>• Immediate next-step research framing</p>
          </div>
          {(profile.role === 'student' || profile.role === 'admin') && (
            <Link to="/check-topic" className="mt-5 inline-flex">
              <Button size="sm">Open checker</Button>
            </Link>
          )}
        </Card>
      </div>

      <Modal open={openInsightModal} onClose={() => setOpenInsightModal(false)} title="Strategic Insight Snapshot">
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Current repository posture indicates strong coverage in established areas and room for deeper specialization in niche applied domains.
          </p>
          <p>
            Encourage students to include explicit local datasets, comparative baselines, and measurable implementation constraints to maximize originality.
          </p>
          <div className="pt-2">
            <Button size="sm" onClick={() => setOpenInsightModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
