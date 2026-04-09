import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { createEmbedding, generateGroundedRecommendation, generateTopicFollowUpResponse } from '../../lib/gemini'
import { db } from '../../lib/firebase'
import { getPdfDocument } from '../../lib/pdfjs'
import type {
  ProjectRecord,
  TopicChatMessage,
  TopicCheckInput,
  TopicCheckResult,
  TopicCheckSessionRecord,
} from '../../types'
import { buildSemanticQuery } from '../../utils/parsers'
import { riskFromSimilarity } from '../../utils/risk'
import { findSimilarProjects } from '../projects/vectorSearchService'

const TOPIC_CHECK_SESSION_COLLECTION = 'topicCheckSessions'
const PDF_CONTEXT_LIMIT = 3200

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function getTopicCheckSessionsCollection(userUid: string) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  return collection(db, 'users', userUid, TOPIC_CHECK_SESSION_COLLECTION)
}

function getTopicCheckSessionRef(userUid: string, sessionId: string) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  return doc(db, 'users', userUid, TOPIC_CHECK_SESSION_COLLECTION, sessionId)
}

function fallbackTopicCheckResult(): TopicCheckResult {
  return {
    matches: [],
    risk: 'low',
    recommendation: {
      noveltyAssessment: '',
      overlapExplanation: '',
      refinementSuggestions: [],
      alternativeTopics: [],
      researchGaps: [],
    },
  }
}

function normalizeChatMessage(value: unknown): TopicChatMessage | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const payload = value as Partial<TopicChatMessage>
  const role = payload.role === 'user' ? 'user' : payload.role === 'assistant' ? 'assistant' : null

  if (!role || typeof payload.content !== 'string') {
    return null
  }

  return {
    id: typeof payload.id === 'string' && payload.id.trim() ? payload.id : crypto.randomUUID(),
    role,
    content: payload.content,
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : new Date().toISOString(),
  }
}

function normalizeTopicCheckSessionRecord(
  sessionId: string,
  userUid: string,
  data: Partial<TopicCheckSessionRecord>,
): TopicCheckSessionRecord {
  const normalizedMessages = Array.isArray(data.messages)
    ? data.messages
        .map((message) => normalizeChatMessage(message))
        .filter((message): message is TopicChatMessage => Boolean(message))
    : []

  return {
    id: sessionId,
    userUid,
    input: data.input || {
      proposedTitle: '',
      proposedDescription: '',
      optionalKeywords: [],
    },
    result: data.result || fallbackTopicCheckResult(),
    messages: normalizedMessages,
    pdfContext: typeof data.pdfContext === 'string' ? data.pdfContext : '',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  }
}

function isTextItem(value: unknown): value is { str: string } {
  return typeof value === 'object'
    && value !== null
    && 'str' in value
    && typeof (value as { str?: unknown }).str === 'string'
}

async function extractPdfTextFromUrl(fileUrl: string, maxPages = 4) {
  const response = await fetch(fileUrl)

  if (!response.ok) {
    throw new Error('Unable to download PDF for topic check context.')
  }

  const raw = await response.arrayBuffer()
  const pdf = await getPdfDocument(raw)
  const pages: string[] = []
  const count = Math.min(pdf.numPages, maxPages)

  for (let pageNumber = 1; pageNumber <= count; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    let text = ''

    for (const token of content.items) {
      if (isTextItem(token)) {
        text += `${token.str} `
      }
    }

    pages.push(text)
  }

  return normalizeWhitespace(pages.join(' '))
}

function getLatestStudentProject(projects: ProjectRecord[]) {
  return [...projects].sort((a, b) => {
    const first = Date.parse(b.updatedAt || b.createdAt || '') || 0
    const second = Date.parse(a.updatedAt || a.createdAt || '') || 0
    return first - second
  })[0]
}

export async function getLatestStudentPdfContext(userUid: string) {
  if (!db || !userUid.trim()) {
    return ''
  }

  try {
    const projectsSnapshot = await getDocs(
      query(collection(db, 'projects'), where('studentUid', '==', userUid)),
    )

    const projects = projectsSnapshot.docs.map((projectDoc) => {
      return {
        id: projectDoc.id,
        ...(projectDoc.data() as Omit<ProjectRecord, 'id'>),
      }
    })

    const latest = getLatestStudentProject(projects)

    if (!latest?.fileUrl) {
      return ''
    }

    const pdfText = await extractPdfTextFromUrl(latest.fileUrl)

    if (!pdfText) {
      return ''
    }

    return pdfText.slice(0, PDF_CONTEXT_LIMIT)
  } catch {
    return ''
  }
}

export async function createTopicCheckSession(params: {
  userUid: string
  input: TopicCheckInput
  result: TopicCheckResult
  initialAssistantMessage: string
  pdfContext?: string
}) {
  const now = new Date().toISOString()
  const initialMessage: TopicChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: params.initialAssistantMessage,
    createdAt: now,
  }

  const payload = {
    userUid: params.userUid,
    input: params.input,
    result: params.result,
    messages: [initialMessage],
    pdfContext: params.pdfContext || '',
    createdAt: now,
    updatedAt: now,
  }

  const docRef = await addDoc(getTopicCheckSessionsCollection(params.userUid), payload)

  return normalizeTopicCheckSessionRecord(docRef.id, params.userUid, payload)
}

export async function appendTopicCheckMessage(params: {
  userUid: string
  sessionId: string
  message: TopicChatMessage
}) {
  const sessionRef = getTopicCheckSessionRef(params.userUid, params.sessionId)

  await updateDoc(sessionRef, {
    messages: arrayUnion(params.message),
    updatedAt: params.message.createdAt,
  })
}

export async function deleteTopicCheckConversation(params: {
  userUid: string
  sessionId: string
}) {
  const sessionRef = getTopicCheckSessionRef(params.userUid, params.sessionId)
  await deleteDoc(sessionRef)
}

export const deleteTopicCheckSession = deleteTopicCheckConversation

export function subscribeTopicCheckSessions(
  userUid: string,
  onData: (sessions: TopicCheckSessionRecord[]) => void,
  onError?: (error: Error) => void,
) {
  const sessionsQuery = query(getTopicCheckSessionsCollection(userUid), orderBy('updatedAt', 'desc'))

  return onSnapshot(
    sessionsQuery,
    (snapshot) => {
      const sessions = snapshot.docs.map((sessionDoc) => {
        return normalizeTopicCheckSessionRecord(
          sessionDoc.id,
          userUid,
          sessionDoc.data() as Partial<TopicCheckSessionRecord>,
        )
      })

      onData(sessions)
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function runTopicCheck(input: TopicCheckInput): Promise<TopicCheckResult> {
  const queryText = buildSemanticQuery({
    title: input.proposedTitle,
    description: input.proposedDescription,
    keywords: input.optionalKeywords,
  })

  const queryEmbedding = await createEmbedding(queryText)
  const matches = await findSimilarProjects(queryEmbedding, 5)

  const highestSimilarity = matches[0]?.similarityScore ?? 0
  const risk = riskFromSimilarity(highestSimilarity)

  const recommendation = await generateGroundedRecommendation({
    input,
    matches,
  })

  return {
    matches,
    risk,
    recommendation,
  }
}

export async function askTopicFollowUp(
  input: TopicCheckInput,
  result: TopicCheckResult,
  question: string,
  options?: {
    conversationHistory?: TopicChatMessage[]
    pdfContext?: string
  },
) {
  return generateTopicFollowUpResponse({
    question,
    input,
    result,
    conversationHistory: options?.conversationHistory,
    pdfContext: options?.pdfContext,
  })
}
