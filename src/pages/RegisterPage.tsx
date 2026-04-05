import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { DEPARTMENTS } from '../lib/constants'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { registerThunk } from '../features/auth/authSlice'
import { ensureProfileFromRegisterThunk } from '../features/auth/profileSlice'
import type { RegisterPayload } from '../types'

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Register for Project Repository AI</p>

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
                role: event.target.value as RegisterPayload['role'],
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

          <Button className="sm:col-span-2" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
