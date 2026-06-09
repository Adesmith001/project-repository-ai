import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Topbar } from '../Topbar'

const dispatchMock = vi.fn()

vi.mock('../../../hooks/useAppStore', () => ({
  useAppDispatch: () => dispatchMock,
}))

describe('Topbar', () => {
  const profile = {
    uid: 'admin-1',
    email: 'admin@covenantuniversity.edu.ng',
    fullName: 'Admin User',
    photoURL: '',
    department: 'Computer Science',
    role: 'admin' as const,
    staffId: 'CU-001',
    assignedSupervisorUid: '',
    assignedSupervisorName: '',
    uploadCleared: true,
    clearedBySupervisorUid: '',
    clearedBySupervisorName: '',
    clearanceUpdatedAt: '',
    createdAt: '',
    updatedAt: '',
  }

  it('opens the desktop account dropdown', async () => {
    render(
      <MemoryRouter>
        <Topbar profile={profile} authorizedRole="admin" />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: /open account menu/i }))

    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })

  it('opens the notification center from the bell button', async () => {
    render(
      <MemoryRouter>
        <Topbar profile={profile} authorizedRole="admin" />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.getByText(/notification center/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /manage users/i })).toBeInTheDocument()
  })
})
