import { describe, expect, it } from 'vitest'
import { buildSupervisorSuggestions, resolveSupervisorRouting } from '../../auth/supervisorLookupService'
import type { UserProfile } from '../../../types'

function createSupervisor(overrides: Partial<UserProfile>): UserProfile {
  return {
    uid: overrides.uid || 'sup-1',
    email: overrides.email || 'john@covenantuniversity.edu.ng',
    fullName: overrides.fullName || 'Dr John Doe',
    photoURL: overrides.photoURL,
    department: overrides.department || 'Computer Science',
    role: overrides.role || 'supervisor',
    staffId: overrides.staffId || 'CU/STAFF/0042',
    assignedSupervisorUid: overrides.assignedSupervisorUid || '',
    assignedSupervisorName: overrides.assignedSupervisorName || '',
    uploadCleared: overrides.uploadCleared ?? true,
    clearedBySupervisorUid: overrides.clearedBySupervisorUid || '',
    clearedBySupervisorName: overrides.clearedBySupervisorName || '',
    clearanceUpdatedAt: overrides.clearanceUpdatedAt || '',
    createdAt: overrides.createdAt || '',
    updatedAt: overrides.updatedAt || '',
  }
}

describe('buildSupervisorSuggestions', () => {
  it('deduplicates supervisor suggestions by normalized name', () => {
    const suggestions = buildSupervisorSuggestions([
      createSupervisor({ uid: 'sup-1', fullName: ' Dr John Doe ' }),
      createSupervisor({ uid: 'sup-2', fullName: 'dr john doe' }),
      createSupervisor({ uid: 'sup-3', fullName: 'Prof Jane Smith' }),
    ])

    expect(suggestions).toEqual([
      { uid: 'sup-1', name: 'Dr John Doe' },
      { uid: 'sup-3', name: 'Prof Jane Smith' },
    ])
  })
})

describe('resolveSupervisorRouting', () => {
  const suggestions = [
    { uid: 'sup-1', name: 'Dr John Doe' },
    { uid: 'sup-2', name: 'Prof Jane Smith' },
  ]

  it('routes matched supervisors to supervisor review', () => {
    expect(resolveSupervisorRouting('dr john doe', suggestions)).toEqual({
      supervisor: 'Dr John Doe',
      supervisorUid: 'sup-1',
      status: 'pending_supervisor',
    })
  })

  it('routes unmatched supervisors directly to admin review', () => {
    expect(resolveSupervisorRouting('Victoria Ojeagbase', suggestions)).toEqual({
      supervisor: 'Victoria Ojeagbase',
      supervisorUid: '',
      status: 'pending_admin',
    })
  })
})
