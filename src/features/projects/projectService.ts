import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { createEmbedding } from '../../lib/gemini'
import { db } from '../../lib/firebase'
import type { ProjectFilters, ProjectInput, ProjectRecord } from '../../types'

function createSemanticInput(input: Pick<ProjectInput, 'title' | 'abstract' | 'keywords'>) {
  return [input.title, input.abstract, input.keywords.join(', ')].join('\n')
}

function getProjectsCollection() {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  return collection(db, 'projects')
}

function applyClientFilters(projects: ProjectRecord[], filters?: Partial<ProjectFilters>) {
  if (!filters) {
    return projects
  }

  return projects.filter((project) => {
    const byDepartment =
      !filters.department || filters.department === 'all' || project.department === filters.department

    const byYear =
      !filters.year || filters.year === 'all' || String(project.year) === String(filters.year)

    const bySupervisor =
      !filters.supervisor || filters.supervisor === 'all' || project.supervisor === filters.supervisor

    const byStatus = !filters.status || filters.status === 'all' || project.status === filters.status

    const searchValue = filters.search?.toLowerCase().trim() || ''
    const bySearch =
      searchValue.length === 0 ||
      project.title.toLowerCase().includes(searchValue) ||
      project.abstract.toLowerCase().includes(searchValue) ||
      project.keywords.some((item) => item.toLowerCase().includes(searchValue))

    return byDepartment && byYear && bySupervisor && byStatus && bySearch
  })
}

export async function listProjects(filters?: Partial<ProjectFilters>) {
  const clauses = [] as ReturnType<typeof where>[]

  if (filters?.department && filters.department !== 'all') {
    clauses.push(where('department', '==', filters.department))
  }

  if (filters?.status && filters.status !== 'all') {
    clauses.push(where('status', '==', filters.status))
  }

  if (filters?.supervisor && filters.supervisor !== 'all') {
    clauses.push(where('supervisor', '==', filters.supervisor))
  }

  if (filters?.year && filters.year !== 'all') {
    clauses.push(where('year', '==', Number(filters.year)))
  }

  const collectionRef = getProjectsCollection()
  const snapshot = clauses.length > 0 ? await getDocs(query(collectionRef, ...clauses)) : await getDocs(collectionRef)

  const projects = snapshot.docs.map((snapshotDoc) => {
    const data = snapshotDoc.data() as Omit<ProjectRecord, 'id'>
    return {
      id: snapshotDoc.id,
      ...data,
    }
  })

  return applyClientFilters(projects, filters)
}

export async function getProjectById(projectId: string) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const snapshot = await getDoc(doc(db, 'projects', projectId))

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<ProjectRecord, 'id'>),
  }
}

export async function createProject(projectInput: ProjectInput) {
  const now = new Date().toISOString()
  const embedding = await createEmbedding(createSemanticInput(projectInput))

  const payload: Omit<ProjectRecord, 'id'> = {
    ...projectInput,
    embedding,
    createdAt: now,
    updatedAt: now,
  }

  const collectionRef = getProjectsCollection()
  const docRef = await addDoc(collectionRef, payload)

  return {
    id: docRef.id,
    ...payload,
  }
}

export async function updateProject(projectId: string, input: Partial<ProjectInput>) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const nextPayload: Partial<ProjectRecord> = {
    ...input,
    updatedAt: new Date().toISOString(),
  }

  if (input.title || input.abstract || input.keywords) {
    const current = await getProjectById(projectId)

    if (current) {
      nextPayload.embedding = await createEmbedding(
        createSemanticInput({
          title: input.title || current.title,
          abstract: input.abstract || current.abstract,
          keywords: input.keywords || current.keywords,
        }),
      )
    }
  }

  await updateDoc(doc(db, 'projects', projectId), nextPayload)

  const refreshed = await getProjectById(projectId)

  if (!refreshed) {
    throw new Error('Project not found after update.')
  }

  return refreshed
}

export async function removeProject(projectId: string) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  await deleteDoc(doc(db, 'projects', projectId))
}
