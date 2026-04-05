import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { runTopicCheckThunk } from '../features/topicChecker/topicCheckerSlice'
import { parseKeywordInput } from '../utils/parsers'

export function CheckTopicPage() {
  const dispatch = useAppDispatch()
  const { result, status, error } = useAppSelector((state) => state.topicChecker)

  const [proposedTitle, setProposedTitle] = useState('')
  const [proposedDescription, setProposedDescription] = useState('')
  const [keywordsText, setKeywordsText] = useState('')

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

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold text-slate-900">Semantic topic checker</h2>
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

          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Checking...' : 'Run topic check'}
          </Button>
        </form>
      </Card>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {result ? (
        <>
          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Duplication risk</h3>
            <p className="mt-2 text-sm capitalize text-slate-700">{result.risk}</p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Similar projects</h3>
            <div className="mt-3 space-y-3">
              {result.matches.map((match) => (
                <div key={match.project.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-800">{match.project.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Similarity score: {(match.similarityScore * 100).toFixed(1)}%
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{match.project.abstract}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Gemini grounded recommendation</h3>
            <div className="mt-3 space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">Novelty assessment</p>
                <p>{result.recommendation.noveltyAssessment}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Overlap explanation</p>
                <p>{result.recommendation.overlapExplanation}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Refinement suggestions</p>
                <ul className="ml-5 list-disc space-y-1">
                  {result.recommendation.refinementSuggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Alternative topics</p>
                <ul className="ml-5 list-disc space-y-1">
                  {result.recommendation.alternativeTopics.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
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
