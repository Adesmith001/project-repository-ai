import type { ProjectFilters, UserRole } from '../types'

export const DEFAULT_DEPARTMENT = 'Computer Science'

export const DEPARTMENTS = [
  'Computer Science',
  'Management Information System (MIS)',
]

export const AREAS = [
  'Software Development',
  'Research',
  'Both'
]

export const PROJECT_STATUSES = ['approved', 'pending_supervisor', 'pending_admin', 'rejected'] as const

export const USER_ROLES: UserRole[] = ['student', 'supervisor', 'admin']

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  department: 'all',
  area: 'all',
  year: 'all',
  supervisor: 'all',
  status: 'all',
  search: '',
}

export const PROJECT_FILTER_YEAR_FLOOR = 2027
