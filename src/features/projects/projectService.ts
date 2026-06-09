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
import { canUseSupervisorMode } from '../../lib/authz'
import { createEmbedding } from '../../lib/gemini'
import { db } from '../../lib/firebase'
import { PROJECT_FILTER_YEAR_FLOOR } from '../../lib/constants'
import type { ProjectFilters, ProjectInput, ProjectRecord, UserProfile } from '../../types'

function normalizeProjectRecord(projectId: string, data: Partial<ProjectRecord>): ProjectRecord {
  return {
    id: projectId,
    title: data.title || '',
    abstract: data.abstract || '',
    keywords: data.keywords || [],
    department: data.department || '',
    area: data.area || 'Both',
    year: data.year || new Date().getFullYear(),
    supervisor: data.supervisor || '',
    supervisorUid: data.supervisorUid || '',
    studentName: data.studentName || '',
    studentUid: data.studentUid || '',
    fileUrl: data.fileUrl?.trim() || '',
    filePublicId: data.filePublicId?.trim() || '',
    fullText: data.fullText || '',
    status: data.status || 'pending_supervisor',
    rejectionReason: data.rejectionReason || '',
    embedding: data.embedding || [],
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  }
}

function createSemanticInput(input: Pick<ProjectInput, 'title' | 'abstract' | 'keywords' | 'fullText'>) {
  if (input.fullText && input.fullText.trim().length > 0) {
    return input.fullText
  }
  return [input.title, input.abstract, input.keywords.join(', ')].join('\n')
}

function getProjectsCollection() {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  return collection(db, 'projects')
}

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeDisplayLabel(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeSupervisorName(value: string) {
  return normalizeSearchValue(value)
}

function isPendingStatus(status: string) {
  return status.startsWith('pending')
}

export function filterProjects(projects: ProjectRecord[], filters?: Partial<ProjectFilters>) {
  if (!filters) {
    return projects
  }

  return projects.filter((project) => {
    const byDepartment =
      !filters.department || filters.department === 'all' || project.department === filters.department

    const byArea =
      !filters.area || filters.area === 'all' || project.area === filters.area

    const byYear =
      !filters.year || filters.year === 'all' || String(project.year) === String(filters.year)

    const bySupervisor =
      !filters.supervisor
      || filters.supervisor === 'all'
      || normalizeSupervisorName(project.supervisor) === normalizeSupervisorName(filters.supervisor)

    const byStatus =
      !filters.status
      || filters.status === 'all'
      || (filters.status === 'pending' ? isPendingStatus(project.status) : project.status === filters.status)

    const searchValue = normalizeSearchValue(filters.search || '')
    const searchableFields = [
      project.title,
      project.abstract,
      project.studentName,
      project.supervisor,
      project.department,
      project.area,
      ...project.keywords,
    ]
    const bySearch =
      searchValue.length === 0 ||
      searchableFields.some((field) => normalizeSearchValue(field).includes(searchValue))

    return byDepartment && byArea && byYear && bySupervisor && byStatus && bySearch
  })
}

export function getProjectYearFilterOptions(
  projects: ProjectRecord[],
  currentYear = new Date().getFullYear(),
) {
  const upperYear = Math.max(
    PROJECT_FILTER_YEAR_FLOOR,
    currentYear,
    ...projects.map((project) => project.year),
  )
  const lowerYear = Math.min(...projects.map((project) => project.year), upperYear)
  const yearOptions = [{ value: 'all', label: 'All Years' }]

  for (let year = upperYear; year >= lowerYear; year -= 1) {
    yearOptions.push({
      value: String(year),
      label: String(year),
    })
  }

  return yearOptions
}

export function getSupervisorFilterOptions(projects: ProjectRecord[]) {
  const supervisorMap = new Map<string, string>()

  for (const project of projects) {
    const normalized = normalizeSupervisorName(project.supervisor)

    if (!normalized || supervisorMap.has(normalized)) {
      continue
    }

    supervisorMap.set(normalized, normalizeDisplayLabel(project.supervisor))
  }

  return [
    { value: 'all', label: 'All Supervisors' },
    ...Array.from(supervisorMap.entries())
      .sort((first, second) => first[1].localeCompare(second[1]))
      .map(([value, label]) => ({ value, label })),
  ]
}

export async function listProjects(filters?: Partial<ProjectFilters>) {
  const clauses = [] as ReturnType<typeof where>[]

  if (filters?.department && filters.department !== 'all') {
    clauses.push(where('department', '==', filters.department))
  }

  if (filters?.area && filters.area !== 'all') {
    clauses.push(where('area', '==', filters.area))
  }

  if (filters?.status && filters.status !== 'all' && filters.status !== 'pending') {
    clauses.push(where('status', '==', filters.status))
  }

  if (filters?.year && filters.year !== 'all') {
    clauses.push(where('year', '==', Number(filters.year)))
  }

  const collectionRef = getProjectsCollection()
  const snapshot = clauses.length > 0 ? await getDocs(query(collectionRef, ...clauses)) : await getDocs(collectionRef)

  const projects = snapshot.docs.map((snapshotDoc) => {
    return normalizeProjectRecord(snapshotDoc.id, snapshotDoc.data() as Partial<ProjectRecord>)
  })

  return filterProjects(projects, filters)
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
    fileUrl: projectInput.fileUrl.trim(),
    filePublicId: projectInput.filePublicId.trim(),
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

  if (typeof input.fileUrl === 'string') {
    nextPayload.fileUrl = input.fileUrl.trim()
  }

  if (typeof input.filePublicId === 'string') {
    nextPayload.filePublicId = input.filePublicId.trim()
  }

  if (input.title || input.abstract || input.keywords || input.fullText) {
    const current = await getProjectById(projectId)

    if (current) {
      nextPayload.embedding = await createEmbedding(
        createSemanticInput({
          title: input.title || current.title,
          abstract: input.abstract || current.abstract,
          keywords: input.keywords || current.keywords,
          fullText: input.fullText || current.fullText,
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
  rejectionReason?: string
  actor: Pick<UserProfile, 'uid' | 'fullName' | 'role' | 'email' | 'staffId'>
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
    if (!canUseSupervisorMode(payload.actor)) {
      throw new Error('Supervisor mode is limited to eligible CU staff accounts.')
    }

    const hasUidMatch = project.supervisorUid.trim().length > 0 && project.supervisorUid === payload.actor.uid

    if (!hasUidMatch) {
      throw new Error('You can only review projects assigned to you.')
    }
  }

  const normalizedReason = payload.rejectionReason?.trim() || ''

  if (payload.status === 'rejected' && normalizedReason.length < 10) {
    throw new Error('Provide a clear rejection reason (at least 10 characters).')
  }

  await updateDoc(doc(db, 'projects', payload.projectId), {
    status: payload.status,
    rejectionReason: payload.status === 'rejected' ? normalizedReason : '',
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
