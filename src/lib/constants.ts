import type { ProjectFilters, UserRole } from '../types'

export const DEFAULT_DEPARTMENT = 'Computer and Information Science'

export const DEPARTMENTS = [
  DEFAULT_DEPARTMENT,
]

export const PROJECT_STATUSES = ['approved', 'pending', 'rejected'] as const

export const USER_ROLES: UserRole[] = ['student', 'supervisor', 'admin']

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  department: 'all',
  year: 'all',
  supervisor: 'all',
  status: 'all',
  search: '',
}
