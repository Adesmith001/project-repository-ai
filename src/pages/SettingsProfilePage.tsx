import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SectionHeading } from '../components/ui/SectionHeading'
import { requestSupervisorEmailChange } from '../features/auth/authService'
import { fetchProfileThunk } from '../features/auth/profileSlice'
import { updateOwnSupervisorProfile } from '../features/auth/profileService'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { useErrorToast } from '../hooks/useErrorToast'
import {
  canUseSupervisorMode,
  CU_SUPERVISOR_EMAIL_DOMAIN,
  getAuthorizedRole,
  getSupervisorEligibilityIssues,
  hasCuSupervisorEmail,
} from '../lib/authz'
import { ShieldCheck, UserRound } from 'lucide-react'

export function SettingsProfilePage() {
  const dispatch = useAppDispatch()
  const profile = useAppSelector((state) => state.profile.profile)
  const authorizedRole = getAuthorizedRole(profile)
  const supervisorRestricted = Boolean(profile?.role === 'supervisor' && !canUseSupervisorMode(profile))
  const supervisorIssues = getSupervisorEligibilityIssues(profile)
  const [staffIdDraft, setStaffIdDraft] = useState(profile?.staffId || '')
  const [institutionalEmailDraft, setInstitutionalEmailDraft] = useState(profile?.email || '')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')
  const [info, setInfo] = useState('')

  useErrorToast(localError)

  useEffect(() => {
    setStaffIdDraft(profile?.staffId || '')
    setInstitutionalEmailDraft(profile?.email || '')
  }, [profile?.email, profile?.staffId])

  async function onSubmitSupervisorRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!profile || profile.role !== 'supervisor') {
      return
    }

    const nextStaffId = staffIdDraft.trim()
    const nextEmail = institutionalEmailDraft.trim().toLowerCase()
    const currentEmail = profile.email.trim().toLowerCase()
    const updates: string[] = []

    // --- Client-side validation (catches issues before touching Firestore) ---
    if (nextStaffId.length > 0 && nextStaffId.length < 2) {
      setLocalError('CU staff ID must be at least 2 characters.')
      return
    }

    if (nextStaffId.length > 64) {
      setLocalError('CU staff ID must be 64 characters or fewer.')
      return
    }

    setSaving(true)
    setLocalError('')
    setInfo('')

    try {
      if (nextEmail !== currentEmail) {
        if (!hasCuSupervisorEmail(nextEmail)) {
          throw new Error(`Use a valid @${CU_SUPERVISOR_EMAIL_DOMAIN} email for supervisor recovery.`)
        }

        await requestSupervisorEmailChange(nextEmail)
        updates.push('Verification sent to your institutional email. Complete it, then sign in again.')
      }

      const staffIdChanged = nextStaffId !== (profile.staffId || '').trim()

      if (staffIdChanged) {
        if (nextStaffId.length < 2) {
          throw new Error('CU staff ID must be at least 2 characters.')
        }

        await updateOwnSupervisorProfile({
          uid: profile.uid,
          fullName: profile.fullName,
          department: profile.department,
          staffId: nextStaffId,
          photoURL: profile.photoURL,
        })

        await dispatch(fetchProfileThunk(profile.uid)).unwrap()
        updates.push('CU staff ID updated.')
      }

      setInfo(updates.length > 0 ? updates.join(' ') : 'No changes to save.')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to update supervisor recovery details.'
      // Strip the "deploy firestore.rules" hint from permission errors — the rules
      // are already up to date; the real cause is always a validation mismatch.
      const cleaned = message.replace(/\.\s*Deploy the latest firestore\.rules.*$/i, '.')
      setLocalError(cleaned)
      setInfo('')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Settings"
        title="Profile and role context"
        description="Review your account identity and institutional role assignment."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Profile status</p>
            <UserRound size={16} className="text-teal-700" />
          </div>
          <p className="mt-2 text-lg font-extrabold text-slate-950">Active</p>
          <p className="mt-1 text-xs text-slate-500">Identity is mapped for repository activity.</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Role</p>
          <p className="mt-2 text-lg font-extrabold capitalize text-slate-950">{authorizedRole}</p>
          <p className="mt-1 text-xs text-slate-500">Governed by institutional admin settings.</p>
        </Card>

        <Card className="p-5" hover>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Department</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{profile?.department || 'Unassigned'}</p>
          <p className="mt-1 text-xs text-slate-500">Used for scoped filtering and repository context.</p>
        </Card>

        <Card className="p-5" hover>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Governance</p>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">Institution controlled</p>
          <p className="mt-1 text-xs text-slate-500">Role changes are restricted to administrators.</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.fullName} className="h-14 w-14 rounded-full border border-slate-200 object-cover" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-slate-100 text-xl font-bold text-slate-700">
              {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <p className="text-xl font-extrabold text-slate-950">{profile?.fullName || 'User profile'}</p>
            <p className="text-sm text-slate-600">{profile?.email || 'No email available'}</p>
          </div>

          <Badge className="ml-auto capitalize">{authorizedRole}</Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="soft-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Department</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile?.department || 'Unassigned'}</p>
          </div>
          <div className="soft-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Role Governance</p>
            <p className="mt-2 text-sm text-slate-700">
              Roles are managed by administrators in Firestore to maintain institutional control.
            </p>
          </div>
          <div className="soft-panel p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">CU Staff ID</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile?.staffId || 'Not provided'}</p>
          </div>
          {profile?.role === 'student' ? (
            <div className="soft-panel p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Assigned Supervisor</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {profile.assignedSupervisorName || 'Not assigned'}
              </p>
            </div>
          ) : null}
          {supervisorRestricted ? (
            <div className="soft-panel border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Supervisor Access Locked</p>
              <p className="mt-2 text-sm text-amber-900">
                {supervisorIssues.includes('missing_cu_email') && supervisorIssues.includes('missing_staff_id')
                  ? `Add your CU staff ID and switch to a verified @${CU_SUPERVISOR_EMAIL_DOMAIN} email to regain supervisor mode.`
                  : supervisorIssues.includes('missing_cu_email')
                    ? `Switch to a verified @${CU_SUPERVISOR_EMAIL_DOMAIN} email to regain supervisor mode.`
                    : 'Add a valid CU staff ID to regain supervisor mode.'}
              </p>
            </div>
          ) : null}
          {profile?.role === 'supervisor' ? (
            <form className="soft-panel p-4 sm:col-span-2 space-y-4" onSubmit={onSubmitSupervisorRecovery}>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Supervisor Recovery</p>
                <p className="mt-2 text-sm text-slate-700">
                  Keep supervisor mode restricted to verified Covenant University identities by updating your institutional email and CU staff ID here.
                </p>
              </div>

              <Input
                label="Institutional email"
                type="email"
                value={institutionalEmailDraft}
                onChange={(event) => setInstitutionalEmailDraft(event.target.value)}
                placeholder={`name@${CU_SUPERVISOR_EMAIL_DOMAIN}`}
              />

              <Input
                label="CU staff ID"
                value={staffIdDraft}
                onChange={(event) => setStaffIdDraft(event.target.value)}
                placeholder="e.g. CU/STAFF/0042"
              />

              {localError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{localError}</p>
              ) : null}

              {info ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{info}</p>
              ) : null}

              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? 'Saving...' : 'Update supervisor access'}
              </Button>
            </form>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
