import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SettingsProfilePage } from '../SettingsProfilePage'

vi.mock('../../hooks/useAppStore', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      profile: {
        profile: {
          uid: 'u1',
          email: 'supervisor@gmail.com',
          fullName: 'Supervisor User',
          photoURL: '',
          department: 'Computer Science',
          role: 'supervisor',
          staffId: '',
          assignedSupervisorUid: '',
          assignedSupervisorName: '',
          uploadCleared: true,
          clearedBySupervisorUid: '',
          clearedBySupervisorName: '',
          clearanceUpdatedAt: '',
          createdAt: '',
          updatedAt: '',
        },
      },
    }),
}))

vi.mock('../../hooks/useErrorToast', () => ({
  useErrorToast: vi.fn(),
}))

describe('SettingsProfilePage', () => {
  it('shows editable supervisor recovery controls', async () => {
    render(<SettingsProfilePage />)

    expect(screen.getByLabelText(/CU staff ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/institutional email/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/CU staff ID/i), 'CU/STAFF/0042')

    expect(screen.getByDisplayValue('CU/STAFF/0042')).toBeInTheDocument()
  })
})
