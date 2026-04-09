import { useState } from 'react'
import ChatTemplate from './chat-template'
import type { TopicCheckSessionRecord } from '../../types'

const demoSessions: TopicCheckSessionRecord[] = [
  {
    id: 'demo-1',
    userUid: 'demo',
    input: {
      proposedTitle: 'AI-powered institutional repository',
      proposedDescription: 'A smart repository for classifying and recommending final-year topics.',
      optionalKeywords: ['ai', 'repository'],
    },
    result: {
      risk: 'medium',
      matches: [],
      recommendation: {
        noveltyAssessment: '',
        overlapExplanation: '',
        refinementSuggestions: [],
        alternativeTopics: [],
        researchGaps: [],
      },
    },
    messages: [
      {
        id: 'm1',
        role: 'assistant',
        content: 'Similarity analysis is complete. Ask me about overlap risk and refinements.',
        createdAt: new Date().toISOString(),
      },
    ],
    pdfContext: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function ChatTemplateDemo() {
  const [activeSessionId, setActiveSessionId] = useState('demo-1')

  return (
    <ChatTemplate
      sessions={demoSessions}
      activeSessionId={activeSessionId}
      loadingHistory={false}
      chatLoading={false}
      onSelectSession={setActiveSessionId}
      onSubmitMessage={() => undefined}
      disabled={false}
      placeholder="Ask follow-up questions about your topic..."
    />
  )
}

export default ChatTemplateDemo
