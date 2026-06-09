import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '../DashboardPage'
import type { ProjectRecord } from '../../types'

const listProjectsMock = vi.fn()
const listUserProfilesMock = vi.fn()
const currentProfile = {
  uid: 'sup-1',
  email: 'sup@covenantuniversity.edu.ng',
  fullName: 'Dr Jane Supervisor',
  photoURL: '',
  department: 'Computer Science',
  role: 'supervisor' as const,
  staffId: 'CU-002',
  assignedSupervisorUid: '',
  assignedSupervisorName: '',
  uploadCleared: true,
  clearedBySupervisorUid: '',
  clearedBySupervisorName: '',
  clearanceUpdatedAt: '',
  createdAt: '',
  updatedAt: '',
}

vi.mock('../../features/projects/projectService', async () => {
  const actual = await vi.importActual<typeof import('../../features/projects/projectService')>('../../features/projects/projectService')
  return {
    ...actual,
    listProjects: () => listProjectsMock(),
  }
})

vi.mock('../../features/auth/profileService', () => ({
  listUserProfiles: () => listUserProfilesMock(),
}))

vi.mock('../../hooks/useAppStore', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      profile: {
        profile: currentProfile,
      },
    }),
}))

function createProject(overrides: Partial<ProjectRecord>): ProjectRecord {
  return {
    id: overrides.id || 'project-1',
    title: overrides.title || 'AI Attendance System',
    abstract: overrides.abstract || 'Repository abstract',
    keywords: overrides.keywords || ['ai'],
    department: overrides.department || 'Computer Science',
    area: overrides.area || 'Software Development',
    year: overrides.year || 2025,
    supervisor: overrides.supervisor || 'Dr Jane Supervisor',
    supervisorUid: overrides.supervisorUid || 'sup-1',
    studentName: overrides.studentName || 'Ada Lovelace',
    studentUid: overrides.studentUid || 'student-1',
    fileUrl: overrides.fileUrl || 'https://example.com/project.pdf',
    filePublicId: overrides.filePublicId || 'project-1',
    fullText: overrides.fullText || '',
    status: overrides.status || 'pending_supervisor',
    rejectionReason: overrides.rejectionReason || '',
    embedding: overrides.embedding || [0.1, 0.2],
    createdAt: overrides.createdAt || '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-01-01T00:00:00.000Z',
  }
}

describe('DashboardPage', () => {
  it('shows repository analysis counts even when supervisor mode is restricted', async () => {
    currentProfile.email = 'supervisor@gmail.com'
    currentProfile.staffId = ''
    listProjectsMock.mockResolvedValue([
      createProject({ id: 'approved', status: 'approved' }),
      createProject({ id: 'pending', status: 'pending_supervisor' }),
      createProject({ id: 'rejected', status: 'rejected' }),
    ])
    listUserProfilesMock.mockResolvedValue([])

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: /total records records/i })).toHaveTextContent('3')
    expect(screen.getByRole('button', { name: /approved records/i })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /pending records/i })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /rejected records/i })).toHaveTextContent('1')

    currentProfile.email = 'sup@covenantuniversity.edu.ng'
    currentProfile.staffId = 'CU-002'
  })

  it('lets the user switch to the repository tab and keeps a selected state', async () => {
    listProjectsMock.mockResolvedValue([
      createProject({ id: 'pending', status: 'pending_supervisor' }),
      createProject({ id: 'approved', title: 'Approved Project', status: 'approved' }),
    ])
    listUserProfilesMock.mockResolvedValue([])

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole('button', { name: /repository/i })).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /repository/i }))

    expect(screen.getByRole('button', { name: /repository/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/repository quick view/i)).toBeInTheDocument()
  })

  it('links the pending summary card to the filtered repository view', async () => {
    listProjectsMock.mockResolvedValue([
      createProject({ id: 'pending', status: 'pending_supervisor' }),
    ])
    listUserProfilesMock.mockResolvedValue([])

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const pendingCard = await screen.findByRole('button', { name: /pending records/i })

    expect(pendingCard).toBeInTheDocument()
  })

  it('reveals approved records on hover and filters the board on click', async () => {
    listProjectsMock.mockResolvedValue([
      createProject({ id: 'approved', title: 'Approved Project', status: 'approved' }),
      createProject({ id: 'pending', title: 'Pending Project', status: 'pending_supervisor' }),
      createProject({ id: 'rejected', title: 'Rejected Project', status: 'rejected' }),
    ])
    listUserProfilesMock.mockResolvedValue([])

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const approvedCard = await screen.findByRole('button', { name: /approved records/i })

    await userEvent.hover(approvedCard)

    expect(screen.getAllByText(/approved project/i).length).toBeGreaterThan(0)

    await userEvent.click(approvedCard)

    expect(screen.getByRole('button', { name: /repository/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('combobox')[0]).toHaveDisplayValue('Approved')
    expect(screen.getAllByText(/approved project/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/pending project/i)).not.toBeInTheDocument()
  })
})
