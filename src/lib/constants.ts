import type { ProjectFilters, UserRole } from '../types'

export const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Electrical Engineering',
  'Data Science',
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
