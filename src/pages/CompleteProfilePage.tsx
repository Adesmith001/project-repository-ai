import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingState } from '../components/states/LoadingState'
import { Select } from '../components/ui/Select'
import { ensureProfileForAuthUserThunk, fetchProfileThunk } from '../features/auth/profileSlice'
import { listSupervisorProfiles, setStudentSupervisorAssignment } from '../features/auth/profileService'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { DEFAULT_DEPARTMENT } from '../lib/constants'
import { useDepartments } from '../hooks/useDepartments'
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
  const { departments } = useDepartments()

  const [fullName, setFullName] = useState(() => user?.displayName?.trim() || user?.email.split('@')[0] || '')
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENT)
  const [role, setRole] = useState<RegisterPayload['role']>('student')
  const [localError, setLocalError] = useState('')
  const [supervisorOptions, setSupervisorOptions] = useState<Array<{ value: string; label: string; name: string }>>([])
  const [selectedSupervisorUid, setSelectedSupervisorUid] = useState('')
  const [loadingSupervisors, setLoadingSupervisors] = useState(true)

  const departmentOptions = useMemo(
    () => departments.map((item) => ({ value: item, label: item })),
    [departments],
  )

  useEffect(() => {
    if (departments.length === 0) {
      return
    }

    setDepartment((prev) => (departments.includes(prev) ? prev : departments[0]))
  }, [departments])

  useEffect(() => {
    let mounted = true

    async function loadSupervisors() {
      try {
        const supervisors = await listSupervisorProfiles()

        if (!mounted) {
          return
        }

        const options = supervisors.map((item) => ({
          value: item.uid,
          label: item.fullName,
          name: item.fullName,
        }))

        setSupervisorOptions(options)
        setSelectedSupervisorUid((prev) => {
          if (prev && options.some((item) => item.value === prev)) {
            return prev
          }

          return options[0]?.value || ''
        })
      } catch {
        if (mounted) {
          setSupervisorOptions([])
        }
      } finally {
        if (mounted) {
          setLoadingSupervisors(false)
        }
      }
    }

    void loadSupervisors()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (role !== 'student') {
      setSelectedSupervisorUid('')
      return
    }

    if (!selectedSupervisorUid && supervisorOptions.length > 0) {
      setSelectedSupervisorUid(supervisorOptions[0].value)
    }
  }, [role, selectedSupervisorUid, supervisorOptions])

  useEffect(() => {
    if (!profile) {
      return
    }

    setFullName((prev) => profile.fullName || prev)
    setDepartment((prev) => profile.department || prev)
    setRole(profile.role === 'admin' ? 'student' : profile.role)

    if (profile.assignedSupervisorUid) {
      setSelectedSupervisorUid(profile.assignedSupervisorUid)
    }
  }, [profile])

  if (!initialized) {
    return <LoadingState fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const requiresSupervisorAssignment = Boolean(
    profile && profile.role === 'student' && !profile.assignedSupervisorUid.trim(),
  )

  if (profile && !requiresSupervisorAssignment) {
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

    if (role === 'student' && !selectedSupervisorUid) {
      setLocalError('Students must select a supervisor before continuing.')
      return
    }

    const selectedSupervisor = supervisorOptions.find((item) => item.value === selectedSupervisorUid)

    if (role === 'student' && !selectedSupervisor) {
      setLocalError('No supervisor is available. Ask an admin to create a supervisor account first.')
      return
    }

    try {
      if (requiresSupervisorAssignment && profile) {
        await setStudentSupervisorAssignment({
          userId: profile.uid,
          supervisorUid: selectedSupervisorUid,
          supervisorName: selectedSupervisor?.name || '',
        })

        await dispatch(fetchProfileThunk(activeUser.uid)).unwrap()
      } else {
        await dispatch(
          ensureProfileForAuthUserThunk({
            uid: activeUser.uid,
            email: activeUser.email,
            displayName: activeUser.displayName,
            photoURL: activeUser.photoURL,
            fullName: fullName.trim(),
            department,
            role,
            assignedSupervisorUid: role === 'student' ? selectedSupervisorUid : '',
            assignedSupervisorName: role === 'student' ? selectedSupervisor?.name || '' : '',
          }),
        ).unwrap()
      }

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
          {requiresSupervisorAssignment
            ? 'Select your supervisor to complete your student onboarding.'
            : 'Select your department and role before continuing to the repository workspace.'}
        </p>

        {role === 'student' && !loadingSupervisors && supervisorOptions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            No supervisor account is available yet. Ask an admin to create at least one supervisor account.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={requiresSupervisorAssignment}
            required
          />

          <Select
            label="Department"
            options={departmentOptions}
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            disabled={requiresSupervisorAssignment}
            required
          />

          <Select
            label="Role"
            options={roleOptions}
            value={role}
            onChange={(event) => setRole(event.target.value as RegisterPayload['role'])}
            disabled={requiresSupervisorAssignment}
            required
          />

          {role === 'student' ? (
            <Select
              label="Assigned supervisor"
              options={
                supervisorOptions.length > 0
                  ? supervisorOptions.map((item) => ({ value: item.value, label: item.label }))
                  : [{ value: '', label: loadingSupervisors ? 'Loading supervisors...' : 'No supervisors available' }]
              }
              value={selectedSupervisorUid}
              onChange={(event) => setSelectedSupervisorUid(event.target.value)}
              required
              disabled={loadingSupervisors || supervisorOptions.length === 0}
            />
          ) : null}

          {localError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{localError}</p>
          ) : null}

          <Button
            className="w-full"
            size="lg"
            type="submit"
            disabled={status === 'loading' || (role === 'student' && (loadingSupervisors || supervisorOptions.length === 0))}
          >
            {status === 'loading'
              ? 'Saving profile...'
              : requiresSupervisorAssignment
                ? 'Save supervisor and continue'
                : 'Continue to dashboard'}
          </Button>
        </form>
      </div>
    </div>
  )
}
