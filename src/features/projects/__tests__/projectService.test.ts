import { describe, expect, it } from 'vitest'
import type { ProjectRecord } from '../../../types'
import {
  filterProjects,
  getProjectYearFilterOptions,
  getSupervisorFilterOptions,
} from '../projectService'

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

describe('filterProjects', () => {
  const projects = [
    createProject({
      id: 'one',
      title: 'AI Attendance System',
      studentName: 'Ada Lovelace',
      supervisor: 'Dr John Doe',
      keywords: ['attendance', 'ai'],
    }),
    createProject({
      id: 'two',
      title: 'Blockchain Voting',
      studentName: 'Grace Hopper',
      supervisor: 'Prof Jane Smith',
      keywords: ['blockchain', 'voting'],
    }),
  ]

  it('matches lecturer names in repository search', () => {
    const result = filterProjects(projects, { search: 'john doe' })
    expect(result.map((project) => project.id)).toEqual(['one'])
  })

  it('matches student names in repository search', () => {
    const result = filterProjects(projects, { search: 'grace hopper' })
    expect(result.map((project) => project.id)).toEqual(['two'])
  })

  it('treats pending as a grouped status filter', () => {
    const result = filterProjects(
      [
        createProject({ id: 'supervisor', status: 'pending_supervisor' }),
        createProject({ id: 'admin', status: 'pending_admin' }),
        createProject({ id: 'approved', status: 'approved' }),
      ],
      { status: 'pending' },
    )

    expect(result.map((project) => project.id)).toEqual(['supervisor', 'admin'])
  })
})

describe('getProjectYearFilterOptions', () => {
  it('includes years through at least 2027', () => {
    const options = getProjectYearFilterOptions(
      [
        createProject({ id: 'one', year: 2024 }),
        createProject({ id: 'two', year: 2022 }),
      ],
      2026,
    )

    expect(options.map((option) => option.value)).toContain('2027')
    expect(options.map((option) => option.value)).toContain('2024')
  })
})

describe('getSupervisorFilterOptions', () => {
  it('deduplicates trivial supervisor name variants', () => {
    const options = getSupervisorFilterOptions([
      createProject({ id: 'one', supervisor: ' Dr John Doe ' }),
      createProject({ id: 'two', supervisor: 'dr john doe' }),
      createProject({ id: 'three', supervisor: 'Prof Jane Smith' }),
    ])

    expect(options.map((option) => option.label)).toEqual([
      'All Supervisors',
      'Dr John Doe',
      'Prof Jane Smith',
    ])
  })
})
