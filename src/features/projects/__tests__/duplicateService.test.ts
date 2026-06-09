import { describe, expect, it } from 'vitest'
import type { ProjectRecord } from '../../../types'
import { findProjectDuplicates } from '../duplicateService'

function createProject(overrides: Partial<ProjectRecord>): ProjectRecord {
  return {
    id: overrides.id || 'project-1',
    title: overrides.title || 'AI Attendance System',
    abstract: overrides.abstract || 'An intelligent attendance platform for campus use.',
    keywords: overrides.keywords || ['ai', 'attendance'],
    department: overrides.department || 'Computer Science',
    area: overrides.area || 'Software Development',
    year: overrides.year || 2024,
    supervisor: overrides.supervisor || 'Dr John Doe',
    supervisorUid: overrides.supervisorUid || 'sup-1',
    studentName: overrides.studentName || 'Ada Lovelace',
    studentUid: overrides.studentUid || 'student-1',
    fileUrl: overrides.fileUrl || 'https://example.com/project.pdf',
    filePublicId: overrides.filePublicId || 'project-1',
    fullText: overrides.fullText || '',
    status: overrides.status || 'approved',
    rejectionReason: overrides.rejectionReason || '',
    embedding: overrides.embedding || [0.1, 0.2, 0.3],
    createdAt: overrides.createdAt || '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-01-01T00:00:00.000Z',
  }
}

describe('findProjectDuplicates', () => {
  it('groups exact title duplicates together', () => {
    const duplicates = findProjectDuplicates([
      createProject({ id: 'one', title: 'AI Attendance System' }),
      createProject({ id: 'two', title: ' AI   Attendance System ' }),
      createProject({ id: 'three', title: 'Blockchain Voting' }),
    ])

    expect(duplicates.exactTitleGroups).toHaveLength(1)
    expect(duplicates.exactTitleGroups[0].projects.map((project) => project.id)).toEqual(['one', 'two'])
  })
})
