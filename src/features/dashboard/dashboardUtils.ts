import type { ProjectRecord, UserRole } from '../../types'

export function dashboardSummary(projects: ProjectRecord[], role: UserRole) {
  const total = projects.length
  const approved = projects.filter((item) => item.status === 'approved').length
  const pending = projects.filter((item) => item.status === 'pending').length
  const rejected = projects.filter((item) => item.status === 'rejected').length

  return {
    total,
    approved,
    pending,
    rejected,
    role,
  }
}
