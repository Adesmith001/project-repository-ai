import type { UserProfile, UserRole } from '../types'

export const CU_SUPERVISOR_EMAIL_DOMAIN = 'covenantuniversity.edu.ng'

type SupervisorIdentity = Pick<UserProfile, 'role' | 'email' | 'staffId'>

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function hasCuSupervisorEmail(email: string) {
  const normalized = normalizeEmail(email)
  return normalized.endsWith(`@${CU_SUPERVISOR_EMAIL_DOMAIN}`) && normalized.length > CU_SUPERVISOR_EMAIL_DOMAIN.length + 1
}

export function hasCuStaffId(staffId?: string) {
  return Boolean(staffId?.trim())
}

export function canUseSupervisorMode(profile: SupervisorIdentity | null | undefined) {
  return Boolean(
    profile
      && profile.role === 'supervisor'
      && hasCuSupervisorEmail(profile.email)
      && hasCuStaffId(profile.staffId),
  )
}

export function getAuthorizedRole(profile: SupervisorIdentity | null | undefined): UserRole {
  if (!profile) {
    return 'student'
  }

  if (profile.role === 'supervisor') {
    return canUseSupervisorMode(profile) ? 'supervisor' : 'student'
  }

  return profile.role
}
