import { describe, expect, it } from 'vitest'
import type { ProjectRecord } from '../../../types'
import { scoreProjectSimilarity } from '../vectorSearchService'

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

describe('scoreProjectSimilarity', () => {
  it('treats exact normalized title matches as near-duplicates', () => {
    const project = createProject({
      title: 'AI Attendance System',
      abstract: 'An attendance platform powered by artificial intelligence.',
      keywords: ['attendance', 'ai'],
      embedding: [0.4, 0.3, 0.9],
    })

    const score = scoreProjectSimilarity(project, {
      title: 'ai attendance system',
      abstract: 'Another attendance platform powered by AI.',
      keywords: ['attendance', 'ai'],
      embedding: [0.4, 0.3, 0.9],
    })

    expect(score).toBeGreaterThanOrEqual(0.98)
  })

  it('gives stronger scores to lexical overlap than unrelated titles with similar embeddings', () => {
    const lexicalMatch = createProject({
      id: 'lexical',
      title: 'AI Attendance System',
      abstract: 'Attendance automation using facial recognition and campus analytics.',
      keywords: ['attendance', 'analytics'],
      embedding: [0.9, 0.9, 0.9],
    })

    const semanticOnly = createProject({
      id: 'semantic',
      title: 'Crop Yield Forecasting',
      abstract: 'Agricultural forecasting using climate data.',
      keywords: ['agriculture', 'forecasting'],
      embedding: [0.9, 0.9, 0.9],
    })

    const query = {
      title: 'Attendance Analytics System',
      abstract: 'Attendance automation with analytics.',
      keywords: ['attendance', 'analytics'],
      embedding: [0.9, 0.9, 0.9],
    }

    expect(scoreProjectSimilarity(lexicalMatch, query)).toBeGreaterThan(scoreProjectSimilarity(semanticOnly, query))
  })
})
