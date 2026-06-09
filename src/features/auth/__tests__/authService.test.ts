import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestPasswordReset, requestSupervisorEmailChange } from '../authService'

const sendPasswordResetEmail = vi.fn()
const verifyBeforeUpdateEmail = vi.fn()

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...args),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  verifyBeforeUpdateEmail: (...args: unknown[]) => verifyBeforeUpdateEmail(...args),
}))

vi.mock('../../../lib/firebase', () => ({
  auth: { currentUser: { email: 'old@example.com' } },
}))

describe('authService helpers', () => {
  beforeEach(() => {
    sendPasswordResetEmail.mockReset()
    verifyBeforeUpdateEmail.mockReset()
  })

  it('sends reset email through Firebase Auth', async () => {
    await requestPasswordReset('user@example.com')

    expect(sendPasswordResetEmail).toHaveBeenCalled()
  })

  it('requests a verified auth email change for supervisors', async () => {
    await requestSupervisorEmailChange('new@covenantuniversity.edu.ng')

    expect(verifyBeforeUpdateEmail).toHaveBeenCalled()
  })
})
