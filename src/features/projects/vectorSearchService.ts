import * as firestore from 'firebase/firestore'
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ProjectRecord, SimilarProjectMatch } from '../../types'
import { listProjects } from './projectService'

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
])

export interface SimilarProjectQueryInput {
  embedding: number[]
  title: string
  abstract: string
  keywords: string[]
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stemToken(token: string) {
  if (token.endsWith('ing') && token.length > 5) {
    return token.slice(0, -3)
  }

  if (token.endsWith('ed') && token.length > 4) {
    return token.slice(0, -2)
  }

  if (token.endsWith('es') && token.length > 4) {
    return token.slice(0, -2)
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1)
  }

  return token
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .map((token) => stemToken(token.trim()))
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

function createFrequencyMap(tokens: string[]) {
  return tokens.reduce<Record<string, number>>((acc, token) => {
    acc[token] = (acc[token] || 0) + 1
    return acc
  }, {})
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0) {
    return 0
  }

  const size = Math.min(a.length, b.length)
  let dotProduct = 0
  let magA = 0
  let magB = 0

  for (let index = 0; index < size; index += 1) {
    dotProduct += a[index] * b[index]
    magA += a[index] * a[index]
    magB += b[index] * b[index]
  }

  if (magA === 0 || magB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB))
}

function tokenCosineSimilarity(firstTokens: string[], secondTokens: string[]) {
  if (firstTokens.length === 0 || secondTokens.length === 0) {
    return 0
  }

  const firstMap = createFrequencyMap(firstTokens)
  const secondMap = createFrequencyMap(secondTokens)
  const keys = new Set([...Object.keys(firstMap), ...Object.keys(secondMap)])

  let dotProduct = 0
  let magA = 0
  let magB = 0

  for (const key of keys) {
    const valueA = firstMap[key] || 0
    const valueB = secondMap[key] || 0

    dotProduct += valueA * valueB
    magA += valueA * valueA
    magB += valueB * valueB
  }

  if (magA === 0 || magB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB))
}

function jaccardSimilarity(firstTokens: string[], secondTokens: string[]) {
  if (firstTokens.length === 0 || secondTokens.length === 0) {
    return 0
  }

  const first = new Set(firstTokens)
  const second = new Set(secondTokens)
  const intersection = [...first].filter((token) => second.has(token)).length
  const union = new Set([...first, ...second]).size

  if (union === 0) {
    return 0
  }

  return intersection / union
}

function characterTrigrams(value: string) {
  const normalized = `  ${normalizeText(value)}  `

  if (normalized.trim().length < 3) {
    return []
  }

  const grams: string[] = []

  for (let index = 0; index < normalized.length - 2; index += 1) {
    grams.push(normalized.slice(index, index + 3))
  }

  return grams
}

function diceSimilarity(first: string[], second: string[]) {
  if (first.length === 0 || second.length === 0) {
    return 0
  }

  const secondCounts = second.reduce<Record<string, number>>((acc, gram) => {
    acc[gram] = (acc[gram] || 0) + 1
    return acc
  }, {})

  let overlap = 0

  for (const gram of first) {
    if (secondCounts[gram]) {
      overlap += 1
      secondCounts[gram] -= 1
    }
  }

  return (2 * overlap) / (first.length + second.length)
}

function buildProjectContent(project: ProjectRecord) {
  return {
    titleTokens: tokenize(project.title),
    abstractTokens: tokenize(project.abstract),
    keywordTokens: project.keywords.flatMap((keyword) => tokenize(keyword)),
    titleNgrams: characterTrigrams(project.title),
  }
}

function buildQueryContent(queryInput: Omit<SimilarProjectQueryInput, 'embedding'>) {
  return {
    titleTokens: tokenize(queryInput.title),
    abstractTokens: tokenize(queryInput.abstract),
    keywordTokens: queryInput.keywords.flatMap((keyword) => tokenize(keyword)),
    titleNgrams: characterTrigrams(queryInput.title),
  }
}

function contentSimilarity(project: ProjectRecord, queryInput: Omit<SimilarProjectQueryInput, 'embedding'>) {
  const projectContent = buildProjectContent(project)
  const queryContent = buildQueryContent(queryInput)

  const titleTokenScore = jaccardSimilarity(projectContent.titleTokens, queryContent.titleTokens)
  const titlePhraseScore = diceSimilarity(projectContent.titleNgrams, queryContent.titleNgrams)
  const abstractScore = tokenCosineSimilarity(projectContent.abstractTokens, queryContent.abstractTokens)
  const keywordScore = jaccardSimilarity(projectContent.keywordTokens, queryContent.keywordTokens)

  const blendedScore =
    (titleTokenScore * 0.3)
    + (titlePhraseScore * 0.2)
    + (abstractScore * 0.35)
    + (keywordScore * 0.15)

  const normalizedProjectTitle = normalizeText(project.title)
  const normalizedQueryTitle = normalizeText(queryInput.title)

  if (normalizedProjectTitle && normalizedProjectTitle === normalizedQueryTitle) {
    return Math.max(blendedScore, 0.98)
  }

  return blendedScore
}

function combinedSimilarity(project: ProjectRecord, queryInput: SimilarProjectQueryInput) {
  const semanticScore = cosineSimilarity(project.embedding || [], queryInput.embedding)
  const lexicalScore = contentSimilarity(project, queryInput)

  if (queryInput.embedding.length === 0 || (project.embedding || []).length === 0) {
    return lexicalScore
  }

  return (semanticScore * 0.58) + (lexicalScore * 0.42)
}

function rankBySimilarity(projects: ProjectRecord[], queryInput: SimilarProjectQueryInput, topK: number) {
  return projects
    .map((project) => ({
      project,
      similarityScore: combinedSimilarity(project, queryInput),
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK)
}

async function tryFirestoreVectorSearch(queryInput: SimilarProjectQueryInput, topK: number) {
  if (!db) {
    return null
  }

  try {
    const firestoreAny = firestore as unknown as {
      vector?: (input: number[]) => unknown
      findNearest?: (
        field: string,
        value: unknown,
        options: { limit: number; distanceMeasure: 'COSINE' },
      ) => unknown
    }

    if (!firestoreAny.vector || !firestoreAny.findNearest) {
      return null
    }

    const projectsCollection = collection(db, 'projects')
    const vectorFilter = firestoreAny.findNearest('embedding', firestoreAny.vector(queryInput.embedding), {
      limit: topK,
      distanceMeasure: 'COSINE',
    })

    const snapshot = await getDocs(query(projectsCollection, vectorFilter as firestore.QueryConstraint))

    if (snapshot.empty) {
      return null
    }

    const projects = snapshot.docs.map((item) => {
      const payload = item.data() as Omit<ProjectRecord, 'id'>
      return { id: item.id, ...payload }
    })

    return rankBySimilarity(projects, queryInput, topK)
  } catch {
    return null
  }
}

export async function findSimilarProjects(queryInput: SimilarProjectQueryInput, topK = 5): Promise<SimilarProjectMatch[]> {
  const vectorResults = await tryFirestoreVectorSearch(queryInput, topK)

  if (vectorResults && vectorResults.length > 0) {
    return vectorResults
  }

  const projects = await listProjects()
  return rankBySimilarity(projects, queryInput, topK)
}
