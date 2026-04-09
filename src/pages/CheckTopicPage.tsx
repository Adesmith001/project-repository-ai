import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import ChatTemplate from '../components/ui/chat-template'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { useErrorToast } from '../hooks/useErrorToast'
import {
  appendTopicCheckMessage,
  askTopicFollowUp,
  createTopicCheckSession,
  deleteTopicCheckConversation,
  getLatestStudentPdfContext,
  subscribeTopicCheckSessions,
} from '../features/topicChecker/topicCheckerService'
import { runTopicCheckThunk } from '../features/topicChecker/topicCheckerSlice'
import type { TopicChatMessage, TopicCheckSessionRecord } from '../types'
import { parseKeywordInput } from '../utils/parsers'

const INITIAL_ASSISTANT_CHAT_MESSAGE =
  'Similarity analysis is complete. Ask me about overlap risk, novelty improvements, or how to reshape your topic before final submission.'

const CONVERSATION_DELETE_UNDO_WINDOW_MS = 6000

type PendingConversationDelete = {
  timeoutId: ReturnType<typeof window.setTimeout>
}

export function CheckTopicPage() {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.user)
  const { result, status, error, latestInput } = useAppSelector((state) => state.topicChecker)

  const [proposedTitle, setProposedTitle] = useState('')
  const [proposedDescription, setProposedDescription] = useState('')
  const [keywordsText, setKeywordsText] = useState('')
  const [matchesSearch, setMatchesSearch] = useState('')
  const [minScoreFilter, setMinScoreFilter] = useState<'all' | '0.5' | '0.7' | '0.85'>('all')
  const [sessions, setSessions] = useState<TopicCheckSessionRecord[]>([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [pendingConversationDeletes, setPendingConversationDeletes] = useState<Record<string, PendingConversationDelete>>({})
  const [chatError, setChatError] = useState('')
  const pendingConversationDeletesRef = useRef<Record<string, PendingConversationDelete>>({})

  useErrorToast(error || chatError)

  useEffect(() => {
    if (!authUser?.uid) {
      setSessions([])
      setActiveSessionId('')
      setLoadingHistory(false)
      setPendingConversationDeletes((previous) => {
        Object.values(previous).forEach((entry) => {
          window.clearTimeout(entry.timeoutId)
        })
        return {}
      })
      setChatError('')
      return
    }

    setLoadingHistory(true)

    const unsubscribe = subscribeTopicCheckSessions(
      authUser.uid,
      (nextSessions) => {
        setSessions(nextSessions)
        setLoadingHistory(false)
        setActiveSessionId((previousId) => {
          if (previousId && nextSessions.some((session) => session.id === previousId)) {
            return previousId
          }

          return nextSessions[0]?.id || ''
        })
      },
      (historyError) => {
        setLoadingHistory(false)
        setChatError(historyError.message || 'Unable to refresh topic chat history.')
      },
    )

    return () => {
      unsubscribe()
    }
  }, [authUser?.uid])

  useEffect(() => {
    pendingConversationDeletesRef.current = pendingConversationDeletes
  }, [pendingConversationDeletes])

  useEffect(() => {
    return () => {
      Object.values(pendingConversationDeletesRef.current).forEach((entry) => {
        window.clearTimeout(entry.timeoutId)
      })
    }
  }, [])

  const pendingDeletionIds = useMemo(() => {
    return new Set(Object.keys(pendingConversationDeletes))
  }, [pendingConversationDeletes])

  const visibleSessions = useMemo(() => {
    return sessions.filter((session) => !pendingDeletionIds.has(session.id))
  }, [sessions, pendingDeletionIds])

  const activeSession = useMemo(() => {
    return visibleSessions.find((session) => session.id === activeSessionId) || null
  }, [visibleSessions, activeSessionId])

  useEffect(() => {
    if (activeSessionId && visibleSessions.some((session) => session.id === activeSessionId)) {
      return
    }

    setActiveSessionId(visibleSessions[0]?.id || '')
  }, [visibleSessions, activeSessionId])

  const displayResult = activeSession?.result || result
  const activeInput = activeSession?.input || latestInput

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setChatError('')

    const input = {
      proposedTitle,
      proposedDescription,
      optionalKeywords: parseKeywordInput(keywordsText),
    }

    const action = await dispatch(runTopicCheckThunk(input))

    if (!runTopicCheckThunk.fulfilled.match(action)) {
      return
    }

    const topSimilarity = action.payload.matches[0]?.similarityScore
    toast.success(
      topSimilarity
        ? `Topic check complete. Top similarity: ${(topSimilarity * 100).toFixed(1)}%`
        : 'Topic check complete. No close match found.',
    )

    if (!authUser?.uid) {
      return
    }

    try {
      const pdfContext = await getLatestStudentPdfContext(authUser.uid)
      const session = await createTopicCheckSession({
        userUid: authUser.uid,
        input,
        result: action.payload,
        initialAssistantMessage: INITIAL_ASSISTANT_CHAT_MESSAGE,
        pdfContext,
      })

      setActiveSessionId(session.id)
    } catch (sessionError) {
      setChatError(
        sessionError instanceof Error ? sessionError.message : 'Unable to save topic chat history for this check.',
      )
    }
  }

  async function onChatSubmit(question: string) {
    if (!authUser?.uid || !activeSession || !activeInput || chatLoading) {
      return
    }

    const userMessage: TopicChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    }

    setChatLoading(true)
    setChatError('')

    try {
      await appendTopicCheckMessage({
        userUid: authUser.uid,
        sessionId: activeSession.id,
        message: userMessage,
      })

      const answer = await askTopicFollowUp(activeInput, activeSession.result, question, {
        conversationHistory: [...activeSession.messages, userMessage],
        pdfContext: activeSession.pdfContext,
      })

      const assistantMessage: TopicChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
        createdAt: new Date().toISOString(),
      }

      await appendTopicCheckMessage({
        userUid: authUser.uid,
        sessionId: activeSession.id,
        message: assistantMessage,
      })
    } catch (followUpError) {
      setChatError(
        followUpError instanceof Error ? followUpError.message : 'Unable to run AI follow-up chat at the moment.',
      )
    } finally {
      setChatLoading(false)
    }
  }

  async function onDeleteSession(sessionId: string) {
    if (!authUser?.uid || pendingConversationDeletes[sessionId]) {
      return
    }

    const session = sessions.find((entry) => entry.id === sessionId)
    const sessionName = session?.input.proposedTitle?.trim() || 'this conversation'

    const confirmed = window.confirm(`Delete ${sessionName}? You can undo this for a few seconds.`)

    if (!confirmed) {
      return
    }

    setChatError('')

    const timeoutId = window.setTimeout(async () => {
      try {
        await deleteTopicCheckConversation({
          userUid: authUser.uid,
          sessionId,
        })

        toast.success('Conversation deleted.')
      } catch (deleteError) {
        setChatError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the selected conversation.')
      } finally {
        setPendingConversationDeletes((previous) => {
          const next = { ...previous }
          delete next[sessionId]
          return next
        })
      }
    }, CONVERSATION_DELETE_UNDO_WINDOW_MS)

    setPendingConversationDeletes((previous) => ({
      ...previous,
      [sessionId]: { timeoutId },
    }))

    if (activeSessionId === sessionId) {
      setActiveSessionId('')
    }

    toast((toastInstance) => (
      <div className="flex items-center gap-2 text-sm">
        <span>Conversation scheduled for deletion.</span>
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            setPendingConversationDeletes((previous) => {
              const pending = previous[sessionId]

              if (!pending) {
                return previous
              }

              window.clearTimeout(pending.timeoutId)
              const next = { ...previous }
              delete next[sessionId]
              return next
            })

            toast.dismiss(toastInstance.id)
            toast.success('Delete undone.')
          }}
        >
          Undo
        </button>
      </div>
    ), {
      duration: CONVERSATION_DELETE_UNDO_WINDOW_MS,
    })
  }

  const filteredMatches = useMemo(() => {
    if (!displayResult) {
      return []
    }

    const query = matchesSearch.trim().toLowerCase()
    const minScore = minScoreFilter === 'all' ? 0 : Number(minScoreFilter)

    return displayResult.matches.filter((match) => {
      const bySearch =
        query.length === 0 ||
        match.project.title.toLowerCase().includes(query) ||
        match.project.department.toLowerCase().includes(query) ||
        match.project.supervisor.toLowerCase().includes(query)

      const byScore = match.similarityScore >= minScore

      return bySearch && byScore
    })
  }, [displayResult, matchesSearch, minScoreFilter])

  return (
    <div className="space-y-6 pt-4 pb-2">
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

      {displayResult ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Duplication risk</p>
              <Badge className="mt-3 inline-flex capitalize" tone={displayResult.risk === 'high' ? 'warning' : displayResult.risk === 'medium' ? 'default' : 'success'}>
                {displayResult.risk}
              </Badge>
            </Card>

            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Matches found</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-950">{displayResult.matches.length}</p>
            </Card>

            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Top similarity</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-950">
                {displayResult.matches[0] ? `${(displayResult.matches[0].similarityScore * 100).toFixed(1)}%` : '0%'}
              </p>
            </Card>

            <Card className="p-5" hover>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Novelty summary</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-700">{displayResult.recommendation.noveltyAssessment}</p>
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
                <p>{displayResult.recommendation.noveltyAssessment}</p>
              </div>
              <div className="soft-panel p-4">
                <p className="font-bold text-slate-900">Overlap explanation</p>
                <p>{displayResult.recommendation.overlapExplanation}</p>
              </div>
              <div className="soft-panel p-4">
                <p className="font-semibold text-slate-900">Refinement suggestions</p>
                <ul className="ml-5 list-disc space-y-1">
                  {displayResult.recommendation.refinementSuggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="soft-panel p-4">
                <p className="font-semibold text-slate-900">Alternative topics</p>
                <ul className="ml-5 list-disc space-y-1">
                  {displayResult.recommendation.alternativeTopics.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="soft-panel p-4">
                <p className="font-semibold text-slate-900">Research gaps</p>
                <ul className="ml-5 list-disc space-y-1">
                  {displayResult.recommendation.researchGaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-extrabold text-slate-950">Ask AI about this similarity result</h3>
            <p className="mt-1 text-sm text-slate-600">
              Continue with follow-up questions about overlap, novelty gaps, and practical revision strategy.
            </p>

            <div className="mt-4">
              <ChatTemplate
                sessions={visibleSessions}
                activeSessionId={activeSessionId}
                loadingHistory={loadingHistory}
                chatLoading={chatLoading}
                onSelectSession={setActiveSessionId}
                onSubmitMessage={(value) => {
                  void onChatSubmit(value)
                }}
                onDeleteSession={(sessionId) => {
                  void onDeleteSession(sessionId)
                }}
                deletingSessionIds={pendingDeletionIds}
                disabled={chatLoading || !activeSession}
                placeholder={
                  activeSession
                    ? 'Ask the AI about your topic overlap and improvements...'
                    : 'Run a topic check and select a conversation to continue...'
                }
                renderAssistantMessage={(content) => (
                  <div className="leading-6 [&_a]:font-semibold [&_a]:text-teal-700 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                )}
              />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
