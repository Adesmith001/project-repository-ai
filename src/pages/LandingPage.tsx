import { Link } from 'react-router-dom'
import { Reveal } from '../components/animations/Reveal'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'

const trustItems = ['Faculty Boards', 'Department Labs', 'Capstone Committees', 'Research Supervisors', 'Innovation Units']

const featureCards = [
  {
    title: 'Semantic Similarity Intelligence',
    body: 'Detect topic overlap using vector-based retrieval over historical project abstracts and keywords.',
  },
  {
    title: 'Originality Confidence Scoring',
    body: 'Convert nearest-match evidence into practical low, medium, or high duplication risk guidance.',
  },
  {
    title: 'Grounded AI Recommendation Layer',
    body: 'Generate novelty assessments, refinement plans, and research gap suggestions based on retrieved context.',
  },
  {
    title: 'Supervision-Ready Repository',
    body: 'Browse approved records by department, year, supervisor, and status with consistent metadata structure.',
  },
]

const showcase = [
  {
    title: 'Repository browsing built for academic rigor',
    body: 'Filter and inspect project history through structured records that support confident supervisor review.',
    bullet: ['Department + year filters', 'Supervisor-specific traceability', 'Project detail with source PDF'],
  },
  {
    title: 'Topic checking designed for decision quality',
    body: 'The platform evaluates idea similarity before commitment, reducing avoidable duplication and weak scope selection.',
    bullet: ['Proposal embedding + nearest matches', 'Interpretable overlap evidence', 'Risk classification in seconds'],
  },
  {
    title: 'Recommendation workflow that feels editorial',
    body: 'AI outputs are structured and actionable, helping students refine scope and identify credible unexplored gaps.',
    bullet: ['Novelty narrative', 'Alternative topics', 'Research-gap shortlist'],
  },
]

const workflow = [
  'Upload and structure project records with PDF artifacts.',
  'Search and filter repository context before topic commitment.',
  'Run semantic overlap checks using vector similarity.',
  'Generate grounded originality recommendations.',
  'Refine topic scope and document research gaps with confidence.',
]

const faqs = [
  {
    question: 'How does this prevent project duplication?',
    answer:
      'Each proposal is transformed into semantic vectors and compared against historical project embeddings to identify meaningful thematic overlap.',
  },
  {
    question: 'Is AI output grounded in repository evidence?',
    answer:
      'Yes. Recommendations are generated only after similar records are retrieved, so explanation quality is tied to real data context.',
  },
  {
    question: 'Who can upload and manage projects?',
    answer:
      'Admin-managed workflows control record creation and curation, while students and supervisors consume repository intelligence for decision-making.',
  },
]

export function LandingPage() {
  return (
    <div className="pb-16">
      <div className="border-b border-slate-200/70 bg-white/70 px-4 py-2 text-center text-xs text-slate-600 backdrop-blur">
        New: AI REPO now includes grounded originality checks for final-year topics.
      </div>

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="content-shell flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-teal-500 to-cyan-400 text-xs font-bold text-slate-950">AI</span>
            <p className="brand-wordmark text-sm text-slate-900">AI REPO</p>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">Features</a>
            <a href="#workflow" className="transition hover:text-slate-900">Workflow</a>
            <a href="#faq" className="transition hover:text-slate-900">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="section-space">
        <div className="content-shell">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Reveal>
                <Badge tone="accent">Academic Intelligence Platform</Badge>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="display-title mt-5 max-w-4xl text-balance text-slate-950">
                  Make every project topic more original, defensible, and research-worthy.
                </h1>
              </Reveal>
              <Reveal delay={150}>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  AI REPO helps students and supervisors evaluate similarity against historical records, surface genuine research gaps,
                  and make smarter final-year project decisions.
                </p>
              </Reveal>
              <Reveal delay={220}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/register">
                    <Button size="lg">Create workspace</Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="secondary">Open existing workspace</Button>
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={190}>
              <Card className="p-6" hover>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quick overview</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-950">AI REPO workflow</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <p>- Curate institutional project records with metadata + PDF</p>
                  <p>- Run similarity checks before topic approval</p>
                  <p>- Generate grounded AI recommendations for refinement</p>
                </div>
                <Link to="/register" className="mt-5 inline-flex">
                  <Button size="sm">Start now</Button>
                </Link>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-space border-y border-slate-200/70 bg-white/60">
        <div className="content-shell">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trusted by</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {trustItems.map((item) => (
              <div key={item} className="soft-panel px-4 py-3 text-center text-sm font-semibold text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="section-space">
        <div className="content-shell space-y-10">
          <SectionHeading
            eyebrow="Core Capabilities"
            title="Precision tools for originality and project direction"
            description="A focused feature set designed for institutions that care about quality, novelty, and research credibility."
            align="center"
          />
          <div className="grid gap-5 md:grid-cols-2">
            {featureCards.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <Card hover className="h-full p-6">
                  <h3 className="text-xl font-extrabold text-slate-950">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space border-y border-slate-200/70 bg-white/50">
        <div className="content-shell space-y-8">
          {showcase.map((item, index) => (
            <Reveal key={item.title}>
              <div className="grid items-center gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2">
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <Badge tone="accent" className="mb-4">Product Showcase {index + 1}</Badge>
                  <h3 className="text-3xl font-extrabold text-slate-950">{item.title}</h3>
                  <p className="mt-4 leading-7 text-slate-600">{item.body}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {item.bullet.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-600"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="premium-card animate-soft-pulse h-64 rounded-[20px] bg-slate-50 p-4 sm:h-72">
                    <div className="h-full rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <div className="h-2 w-24 rounded-full bg-slate-200"></div>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 rounded-full bg-slate-100"></div>
                        <div className="h-2 w-5/6 rounded-full bg-slate-100"></div>
                        <div className="h-2 w-3/5 rounded-full bg-slate-100"></div>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="h-24 rounded-xl border border-slate-200 bg-slate-50"></div>
                        <div className="h-24 rounded-xl border border-slate-200 bg-slate-50"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="workflow" className="section-space">
        <div className="content-shell">
          <SectionHeading
            eyebrow="Intelligent Workflow"
            title="How institutions use the platform"
            description="A clear decision pipeline from archive ingestion to final topic refinement."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.map((step, index) => (
              <Card key={step} className="p-5" hover>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{step}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space border-y border-slate-200/70 bg-white/50">
        <div className="content-shell">
          <SectionHeading
            eyebrow="Credibility"
            title="Built for serious academic outcomes"
            description="Designed to support supervisors, improve student decisions, and strengthen project defense quality."
            align="center"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="p-6" hover>
              <p className="text-sm leading-7 text-slate-700">“Our department now catches topic overlap earlier and guides students into stronger research questions.”</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Head of Department</p>
            </Card>
            <Card className="p-6" hover>
              <p className="text-sm leading-7 text-slate-700">“The AI recommendations are structured enough for supervision discussions, not just generic suggestions.”</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Senior Supervisor</p>
            </Card>
            <Card className="p-6" hover>
              <p className="text-sm leading-7 text-slate-700">“It gave me confidence that my topic was distinct and helped me narrow into a stronger research gap.”</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Final-year Student</p>
            </Card>
          </div>
        </div>
      </section>

      <section id="faq" className="section-space">
        <div className="content-shell">
          <SectionHeading eyebrow="FAQ" title="Common questions" description="Everything needed to adopt the platform quickly." />
          <div className="mt-8 space-y-3">
            {faqs.map((item) => (
              <details key={item.question} className="premium-card rounded-2xl p-5">
                <summary className="cursor-pointer list-none text-lg font-bold text-slate-900">{item.question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/70 py-8">
        <div className="content-shell flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
          <p className="brand-wordmark">AI REPO</p>
          <p>AI-powered originality, research depth, and academic trust.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="font-semibold text-slate-800">Sign in</Link>
            <Link to="/register" className="font-semibold text-slate-800">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
