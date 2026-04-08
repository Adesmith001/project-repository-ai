import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useAppSelector } from '../hooks/useAppStore'
import { ShieldCheck, UserRound } from 'lucide-react'

export function SettingsProfilePage() {
  const profile = useAppSelector((state) => state.profile.profile)

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
          <p className="mt-2 text-lg font-extrabold capitalize text-slate-950">{profile?.role || 'student'}</p>
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

          <Badge className="ml-auto capitalize">{profile?.role || 'student'}</Badge>
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
          {profile?.role === 'student' ? (
            <div className="soft-panel p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Assigned Supervisor</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {profile.assignedSupervisorName || 'Not assigned'}
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
