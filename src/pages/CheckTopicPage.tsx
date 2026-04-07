import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { runTopicCheckThunk } from '../features/topicChecker/topicCheckerSlice'
import { parseKeywordInput } from '../utils/parsers'

export function CheckTopicPage() {
  const dispatch = useAppDispatch()
  const { result, status, error } = useAppSelector((state) => state.topicChecker)

  const [proposedTitle, setProposedTitle] = useState('')
  const [proposedDescription, setProposedDescription] = useState('')
  const [keywordsText, setKeywordsText] = useState('')
  const [matchesSearch, setMatchesSearch] = useState('')
  const [minScoreFilter, setMinScoreFilter] = useState<'all' | '0.5' | '0.7' | '0.85'>('all')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await dispatch(
      runTopicCheckThunk({
        proposedTitle,
        proposedDescription,
        optionalKeywords: parseKeywordInput(keywordsText),
      }),
    )
  }

  const filteredMatches = useMemo(() => {
    if (!result) {
      return []
    }

    const query = matchesSearch.trim().toLowerCase()
    const minScore = minScoreFilter === 'all' ? 0 : Number(minScoreFilter)

    return result.matches.filter((match) => {
      const bySearch =
        query.length === 0 ||
        match.project.title.toLowerCase().includes(query) ||
        match.project.department.toLowerCase().includes(query) ||
        match.project.supervisor.toLowerCase().includes(query)

      const byScore = match.similarityScore >= minScore

      return bySearch && byScore
    })
  }, [result, matchesSearch, minScoreFilter])

  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Topic Intelligence"
        title="Evaluate originality before committing"
        description="Use semantic retrieval and grounded AI recommendation to avoid duplicate scope and discover stronger research gaps."
      />

      <Card className="p-6">
        <h2 className="text-xl font-extrabold text-slate-950">Semantic topic checker</h2>
        <p className="mt-1 text-sm text-slate-600">
          Compare a new project proposal against previous records using Firestore vector similarity and grounded AI suggestions.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
          <Input
            label="Proposed title"
            value={proposedTitle}
            onChange={(event) => setProposedTitle(event.target.value)}
            required
          />

          <Textarea
            label="Proposed description"
            value={proposedDescription}
            onChange={(event) => setProposedDescription(event.target.value)}
            required
          />

          <Input
            label="Optional keywords (comma-separated)"
            value={keywordsText}
            onChange={(event) => setKeywordsText(event.target.value)}
          />

          <Button size="lg" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Checking...' : 'Run topic check'}
          </Button>
        </form>
      </Card>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {result ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Duplication risk</p>
              <Badge className="mt-3 inline-flex capitalize" tone={result.risk === 'high' ? 'warning' : result.risk === 'medium' ? 'default' : 'success'}>
                {result.risk}
              </Badge>
            </Card>

            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Matches found</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-950">{result.matches.length}</p>
            </Card>

            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Top similarity</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-950">
                {result.matches[0] ? `${(result.matches[0].similarityScore * 100).toFixed(1)}%` : '0%'}
              </p>
            </Card>

            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Novelty summary</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-700">{result.recommendation.noveltyAssessment}</p>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-extrabold text-slate-950">Similar projects</h3>
              <p className="mt-1 text-sm text-slate-500">Search and filter by score to inspect the closest overlaps quickly.</p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <SlidersHorizontal size={14} className="text-slate-500" />
                Filters
              </div>

              <div className="control-strip control-strip-4">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <Search size={15} className="text-slate-400" />
                  <input
                    value={matchesSearch}
                    onChange={(event) => setMatchesSearch(event.target.value)}
                    placeholder="Search title, department, supervisor"
                    className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>

                <select
                  value={minScoreFilter}
                  onChange={(event) => setMinScoreFilter(event.target.value as 'all' | '0.5' | '0.7' | '0.85')}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                >
                  <option value="all">Any similarity</option>
                  <option value="0.5">50% and above</option>
                  <option value="0.7">70% and above</option>
                  <option value="0.85">85% and above</option>
                </select>

                <div className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-500 flex items-center">
                  Visible matches: {filteredMatches.length}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    setMatchesSearch('')
                    setMinScoreFilter('all')
                  }}
                >
                  Reset
                </Button>
              </div>

              <div className="table-shell">
                <table className="table-ui">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Department</th>
                      <th>Supervisor</th>
                      <th>Year</th>
                      <th>Similarity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatches.map((match) => (
                      <tr key={match.project.id}>
                        <td>
                          <p className="font-semibold text-slate-900">{match.project.title}</p>
                          <p className="text-xs text-slate-500">{match.project.studentName}</p>
                        </td>
                        <td>{match.project.department}</td>
                        <td>{match.project.supervisor}</td>
                        <td>{match.project.year}</td>
                        <td>
                          <Badge tone={match.similarityScore >= 0.85 ? 'warning' : match.similarityScore >= 0.7 ? 'default' : 'success'}>
                            {(match.similarityScore * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td>
                          <Link to={`/projects/${match.project.id}`}>
                            <Button size="sm" variant="outline">Open</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {filteredMatches.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-sm text-slate-500">No matches satisfy the current filters.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-extrabold text-slate-950">Gemini grounded recommendation</h3>
            <div className="mt-3 space-y-4 text-sm text-slate-700">
              <div className="soft-panel p-4">
                <p className="font-bold text-slate-900">Novelty assessment</p>
                <p>{result.recommendation.noveltyAssessment}</p>
              </div>
              <div className="soft-panel p-4">
                <p className="font-bold text-slate-900">Overlap explanation</p>
                <p>{result.recommendation.overlapExplanation}</p>
              </div>
              <div className="soft-panel p-4">
                <p className="font-semibold text-slate-900">Refinement suggestions</p>
                <ul className="ml-5 list-disc space-y-1">
                  {result.recommendation.refinementSuggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="soft-panel p-4">
                <p className="font-semibold text-slate-900">Alternative topics</p>
                <ul className="ml-5 list-disc space-y-1">
                  {result.recommendation.alternativeTopics.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="soft-panel p-4">
                <p className="font-semibold text-slate-900">Research gaps</p>
                <ul className="ml-5 list-disc space-y-1">
                  {result.recommendation.researchGaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
