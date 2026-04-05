import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingState } from '../components/states/LoadingState'
import { Select } from '../components/ui/Select'
import { ensureProfileForAuthUserThunk } from '../features/auth/profileSlice'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { DEPARTMENTS } from '../lib/constants'
import type { RegisterPayload } from '../types'

function readErrorMessage(value: unknown, fallback: string) {
  if (value instanceof Error && value.message) {
    return value.message
  }

  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

const roleOptions: Array<{ value: RegisterPayload['role']; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'supervisor', label: 'Supervisor' },
]

export function CompleteProfilePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, initialized } = useAppSelector((state) => state.auth)
  const { profile, status } = useAppSelector((state) => state.profile)

  const [fullName, setFullName] = useState(() => user?.displayName?.trim() || user?.email.split('@')[0] || '')
  const [department, setDepartment] = useState(DEPARTMENTS[0] || 'Computer and Information Science')
  const [role, setRole] = useState<RegisterPayload['role']>('student')
  const [localError, setLocalError] = useState('')

  const departmentOptions = useMemo(
    () => DEPARTMENTS.map((item) => ({ value: item, label: item })),
    [],
  )

  if (!initialized) {
    return <LoadingState />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')

    if (!user) {
      setLocalError('You need to sign in before completing your profile.')
      return
    }

    const activeUser = user

    if (fullName.trim().length < 2) {
      setLocalError('Please enter a valid full name.')
      return
    }

    try {
      await dispatch(
        ensureProfileForAuthUserThunk({
          uid: activeUser.uid,
          email: activeUser.email,
          displayName: activeUser.displayName,
          photoURL: activeUser.photoURL,
          fullName: fullName.trim(),
          department,
          role,
        }),
      ).unwrap()

      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setLocalError(readErrorMessage(submitError, 'Unable to save your profile.'))
    }
  }

  return (
    <div className="content-shell flex min-h-screen items-center py-10">
      <div className="premium-card mx-auto w-full max-w-xl p-8 sm:p-10">
        <Badge tone="accent" className="mb-3">Google Profile Setup</Badge>
        <h1 className="text-3xl font-extrabold text-slate-950">Complete your account profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select your department and role before continuing to the repository workspace.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />

          <Select
            label="Department"
            options={departmentOptions}
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            required
          />

          <Select
            label="Role"
            options={roleOptions}
            value={role}
            onChange={(event) => setRole(event.target.value as RegisterPayload['role'])}
            required
          />

          {localError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{localError}</p>
          ) : null}

          <Button className="w-full" size="lg" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving profile...' : 'Continue to dashboard'}
          </Button>
        </form>
      </div>
    </div>
  )
}
