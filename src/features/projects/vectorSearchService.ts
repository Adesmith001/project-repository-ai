import * as firestore from 'firebase/firestore'
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { ProjectRecord, SimilarProjectMatch } from '../../types'
import { listProjects } from './projectService'

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

function rankBySimilarity(projects: ProjectRecord[], queryEmbedding: number[], topK: number) {
  return projects
    .map((project) => ({
      project,
      similarityScore: cosineSimilarity(project.embedding || [], queryEmbedding),
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK)
}

async function tryFirestoreVectorSearch(queryEmbedding: number[], topK: number) {
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
    const vectorFilter = firestoreAny.findNearest('embedding', firestoreAny.vector(queryEmbedding), {
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

    return rankBySimilarity(projects, queryEmbedding, topK)
  } catch {
    return null
  }
}

export async function findSimilarProjects(queryEmbedding: number[], topK = 5): Promise<SimilarProjectMatch[]> {
  const vectorResults = await tryFirestoreVectorSearch(queryEmbedding, topK)

  if (vectorResults && vectorResults.length > 0) {
    return vectorResults
  }

  const projects = await listProjects()
  return rankBySimilarity(projects, queryEmbedding, topK)
}
