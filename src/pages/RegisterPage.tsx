import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { DEPARTMENTS } from '../lib/constants'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { googleLoginThunk, registerThunk } from '../features/auth/authSlice'
import { ensureProfileForAuthUserThunk, ensureProfileFromRegisterThunk } from '../features/auth/profileSlice'
import type { RegisterPayload } from '../types'
import { Badge } from '../components/ui/Badge'

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'supervisor', label: 'Supervisor' },
]

export function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((state) => state.auth)

  const [form, setForm] = useState<RegisterPayload>({
    fullName: '',
    email: '',
    password: '',
    department: DEPARTMENTS[0],
    role: 'student',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const departmentOptions = useMemo(
    () => DEPARTMENTS.map((item) => ({ value: item, label: item })),
    [],
  )

  async function onGoogleSignup() {
    setLocalError('')

    try {
      const authUser = await dispatch(googleLoginThunk()).unwrap()

      await dispatch(
        ensureProfileForAuthUserThunk({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
          fullName: form.fullName,
          department: form.department,
          role: form.role,
        }),
      ).unwrap()

      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Unable to continue with Google.')
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')

    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }

    if (form.password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    try {
      const authUser = await dispatch(registerThunk(form)).unwrap()

      await dispatch(
        ensureProfileFromRegisterThunk({
          uid: authUser.uid,
          values: form,
        }),
      ).unwrap()

      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Unable to register account.')
    }
  }

  const isSubmitting = status === 'loading'

  return (
    <div className="content-shell flex min-h-screen items-center py-10">
      <div className="premium-card mx-auto w-full max-w-3xl p-8 sm:p-10">
        <Badge tone="accent" className="mb-3">Institutional Onboarding</Badge>
        <h1 className="text-3xl font-extrabold text-slate-950 sm:text-4xl">Create your research workspace profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Admin roles are assigned in the database for governance. New registrations join as Student or Supervisor.
        </p>

        <div className="mt-6">
          <Button variant="outline" className="w-full" onClick={() => void onGoogleSignup()} disabled={isSubmitting}>
            Continue with Google
          </Button>
          <p className="mt-3 text-center text-xs uppercase tracking-[0.16em] text-slate-400">or register with email</p>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            required
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />

          <Select
            label="Department"
            options={departmentOptions}
            value={form.department}
            onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            required
          />

          <Select
            label="Role"
            options={roleOptions}
            value={form.role}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                role: event.target.value as Exclude<RegisterPayload['role'], 'admin'>,
              }))
            }
            required
          />

          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />

          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {localError || error ? (
            <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {localError || error}
            </p>
          ) : null}

          <Button className="sm:col-span-2" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
