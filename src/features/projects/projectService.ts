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
import type { ProjectFilters, ProjectInput, ProjectRecord, UserProfile } from '../../types'

function normalizeProjectRecord(projectId: string, data: Partial<ProjectRecord>): ProjectRecord {
  return {
    id: projectId,
    title: data.title || '',
    abstract: data.abstract || '',
    keywords: data.keywords || [],
    department: data.department || '',
    year: data.year || new Date().getFullYear(),
    supervisor: data.supervisor || '',
    supervisorUid: data.supervisorUid || '',
    studentName: data.studentName || '',
    studentUid: data.studentUid || '',
    fileUrl: data.fileUrl || '',
    filePublicId: data.filePublicId || '',
    status: data.status || 'pending',
    embedding: data.embedding || [],
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  }
}

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
    return normalizeProjectRecord(snapshotDoc.id, snapshotDoc.data() as Partial<ProjectRecord>)
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

  return normalizeProjectRecord(snapshot.id, snapshot.data() as Partial<ProjectRecord>)
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

export async function updateProjectStatus(payload: {
  projectId: string
  status: ProjectRecord['status']
  actor: Pick<UserProfile, 'uid' | 'fullName' | 'role'>
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const project = await getProjectById(payload.projectId)

  if (!project) {
    throw new Error('Project not found.')
  }

  if (payload.actor.role !== 'admin' && payload.actor.role !== 'supervisor') {
    throw new Error('Only supervisors and admins can review projects.')
  }

  if (payload.actor.role === 'supervisor') {
    const hasUidMatch = project.supervisorUid.trim().length > 0 && project.supervisorUid === payload.actor.uid
    const hasNameMatch = project.supervisor.trim().toLowerCase() === payload.actor.fullName.trim().toLowerCase()

    if (!hasUidMatch && !hasNameMatch) {
      throw new Error('You can only review projects assigned to you.')
    }
  }

  await updateDoc(doc(db, 'projects', payload.projectId), {
    status: payload.status,
    updatedAt: new Date().toISOString(),
  })

  const refreshed = await getProjectById(payload.projectId)

  if (!refreshed) {
    throw new Error('Project not found after review update.')
  }

  return refreshed
}

export async function removeProject(projectId: string) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  await deleteDoc(doc(db, 'projects', projectId))
}
