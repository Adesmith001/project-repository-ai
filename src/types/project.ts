export type ProjectStatus = 'approved' | 'pending' | 'rejected'

export interface ProjectRecord {
  id: string
  title: string
  abstract: string
  keywords: string[]
  department: string
  year: number
  supervisor: string
  supervisorUid: string
  studentName: string
  studentUid: string
  fileUrl: string
  filePublicId: string
  status: ProjectStatus
  rejectionReason: string
  embedding: number[]
  createdAt: string
  updatedAt: string
}

export interface ProjectInput {
  title: string
  abstract: string
  keywords: string[]
  department: string
  year: number
  supervisor: string
  supervisorUid: string
  studentName: string
  studentUid: string
  fileUrl: string
  filePublicId: string
  status: ProjectStatus
  rejectionReason: string
}

export interface ProjectFilters {
  department: string
  year: string
  supervisor: string
  status: string
  search: string
}
