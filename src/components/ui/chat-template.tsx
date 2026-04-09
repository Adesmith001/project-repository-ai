import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Bot, MessageSquareText, Search } from 'lucide-react'
import type { TopicCheckSessionRecord } from '../../types'
import { PromptInput } from './ai-chat-input'

type ChatTemplateProps = {
  sessions: TopicCheckSessionRecord[]
  activeSessionId: string
  loadingHistory: boolean
  chatLoading: boolean
  onSelectSession: (sessionId: string) => void
  onSubmitMessage: (message: string) => void
  disabled: boolean
  placeholder: string
  renderAssistantMessage?: (content: string) => ReactNode
}

function formatSessionLabel(session: TopicCheckSessionRecord) {
  return `${new Date(session.updatedAt).toLocaleString()} - ${session.messages.length} messages`
}

export function ChatTemplate({
  sessions,
  activeSessionId,
  loadingHistory,
  chatLoading,
  onSelectSession,
  onSubmitMessage,
  disabled,
  placeholder,
  renderAssistantMessage,
}: ChatTemplateProps) {
  const [sessionQuery, setSessionQuery] = useState('')

  const activeSession = useMemo(() => {
    return sessions.find((session) => session.id === activeSessionId) || null
  }, [sessions, activeSessionId])

  const filteredSessions = useMemo(() => {
    const query = sessionQuery.trim().toLowerCase()

    if (!query) {
      return sessions
    }

    return sessions.filter((session) => {
      return (
        session.input.proposedTitle.toLowerCase().includes(query)
        || session.input.proposedDescription.toLowerCase().includes(query)
      )
    })
  }, [sessions, sessionQuery])

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Conversations</p>

        <label className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            value={sessionQuery}
            onChange={(event) => setSessionQuery(event.target.value)}
            placeholder="Search conversation"
            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
          {loadingHistory && sessions.length === 0 ? (
            <p className="text-sm text-slate-500">Loading history...</p>
          ) : null}

          {!loadingHistory && sessions.length === 0 ? (
            <p className="text-sm text-slate-500">Run a topic check to create your first conversation.</p>
          ) : null}

          {!loadingHistory && sessions.length > 0 && filteredSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No conversation matches your search.</p>
          ) : null}

          {filteredSessions.map((session) => {
            const active = session.id === activeSessionId

            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                }`}
              >
                <p className="line-clamp-2 text-sm font-semibold">
                  {session.input.proposedTitle || 'Untitled topic check'}
                </p>
                <p className={`mt-1 text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                  {formatSessionLabel(session)}
                </p>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex min-h-120 flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="line-clamp-1 text-sm font-semibold text-slate-900">
            {activeSession?.input.proposedTitle || 'Select or create a conversation'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {activeSession ? formatSessionLabel(activeSession) : 'AI guidance will appear here after topic check.'}
          </p>
        </div>

        <div className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          {(activeSession?.messages || []).map((message) => (
            <div
              key={message.id}
              className={`max-w-[92%] rounded-xl px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {message.role === 'assistant'
                ? (renderAssistantMessage
                    ? renderAssistantMessage(message.content)
                    : <p>{message.content}</p>)
                : <p>{message.content}</p>}
            </div>
          ))}

          {chatLoading ? (
            <div className="max-w-[88%] rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-teal-600" />
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500" />
                </div>
                <p className="text-xs text-slate-500">AI is thinking...</p>
              </div>
            </div>
          ) : null}

          {!activeSession && !loadingHistory ? (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <MessageSquareText size={14} className="text-slate-500" />
                <p>Run topic check and pick a conversation from the left.</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3">
          <PromptInput
            placeholder={placeholder}
            disabled={disabled}
            onSubmit={(value) => onSubmitMessage(value)}
          />
        </div>
      </section>
    </div>
  )
}

export default ChatTemplate
