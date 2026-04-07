import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CheckCircle2, Clock3, Sparkles, TrendingUp, XCircle } from 'lucide-react'
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

  const toPercent = (value: number) => {
    if (!summary.total) {
      return 0
    }

    return Math.round((value / summary.total) * 100)
  }

  const approvalRate = toPercent(summary.approved)
  const pendingRate = toPercent(summary.pending)
  const rejectionRate = toPercent(summary.rejected)

  const statusCards = [
    {
      label: 'Total Projects',
      value: summary.total,
      icon: Activity,
      iconClass: 'bg-slate-100 text-slate-700',
      footnote: 'Current institutional records',
    },
    {
      label: 'Approved',
      value: summary.approved,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-100 text-emerald-700',
      footnote: `${approvalRate}% approval rate`,
    },
    {
      label: 'Pending',
      value: summary.pending,
      icon: Clock3,
      iconClass: 'bg-amber-100 text-amber-700',
      footnote: `${pendingRate}% requires review`,
    },
    {
      label: 'Rejected',
      value: summary.rejected,
      icon: XCircle,
      iconClass: 'bg-rose-100 text-rose-700',
      footnote: `${rejectionRate}% rejected`,
    },
  ]

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

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="space-y-5 p-6" hover>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Portfolio health</p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-950">AI REPO Performance Snapshot</h3>
            </div>
            <Badge tone="accent">Live repository context</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="soft-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Approved</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700">{approvalRate}%</p>
            </div>
            <div className="soft-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-extrabold text-amber-700">{pendingRate}%</p>
            </div>
            <div className="soft-panel p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Rejected</p>
              <p className="mt-2 text-2xl font-extrabold text-rose-700">{rejectionRate}%</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Approval momentum</span>
                <span>{approvalRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${approvalRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Pending load</span>
                <span>{pendingRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-amber-500" style={{ width: `${pendingRate}%` }}></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6" hover>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold text-slate-950">Strategic Insight</h3>
            <Sparkles size={18} className="text-teal-600" />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Use this panel to quickly review originality posture and spot where supervision can increase project quality.
          </p>
          <div className="mt-4 soft-panel p-4">
            <p className="text-sm font-semibold text-slate-800">Recommendation focus</p>
            <p className="mt-1 text-sm text-slate-600">
              Encourage stronger datasets, explicit baselines, and measurable constraints in pending submissions.
            </p>
          </div>
          <Button size="sm" className="mt-4" onClick={() => setOpenInsightModal(true)}>
            Open insight panel
          </Button>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.label} hover>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{item.value}</p>
                </div>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.iconClass}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{item.footnote}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="space-y-4" hover>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-extrabold text-slate-950">Workspace actions</h3>
            <Badge tone="default">Role-aware shortcuts</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Link to="/projects" className="soft-panel p-4 transition hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">Browse project repository</p>
              <p className="mt-1 text-sm text-slate-600">Inspect department records, supervisors, and historical outcomes.</p>
            </Link>

            {(profile.role === 'student' || profile.role === 'admin') && (
              <Link to="/check-topic" className="soft-panel p-4 transition hover:bg-white">
                <p className="text-sm font-semibold text-slate-900">Check topic originality</p>
                <p className="mt-1 text-sm text-slate-600">Run semantic overlap analysis before committing your project scope.</p>
              </Link>
            )}

            {profile.role === 'admin' && (
              <Link to="/upload-project" className="soft-panel p-4 transition hover:bg-white">
                <p className="text-sm font-semibold text-slate-900">Upload project records</p>
                <p className="mt-1 text-sm text-slate-600">Maintain institutional knowledge with curated PDF-backed metadata.</p>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpenInsightModal(true)}
              className="soft-panel p-4 text-left transition hover:bg-white"
            >
              <p className="text-sm font-semibold text-slate-900">Open strategic insights panel</p>
              <p className="mt-1 text-sm text-slate-600">Preview AI-readiness and originality posture for active users.</p>
            </button>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold text-slate-950">Operational focus</h3>
            <TrendingUp size={17} className="text-teal-600" />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Project upload workflows are admin-governed. Students should use topic checking to refine before submission.
          </p>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>- PDF-first repository structure</p>
            <p>- Metadata + embedding creation</p>
            <p>- Supervisor and status traceability</p>
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
              <div key={project.id} className="soft-panel px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{project.title}</p>
                <p className="mt-1 text-xs text-slate-600">{project.department} | {project.year} | {project.status}</p>
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
            <p>- Grounded to retrieved project context</p>
            <p>- Structured results for supervision meetings</p>
            <p>- Immediate next-step research framing</p>
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
