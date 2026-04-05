import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useAppSelector } from '../hooks/useAppStore'

export function SettingsProfilePage() {
  const profile = useAppSelector((state) => state.profile.profile)

  return (
    <div className="space-y-6 py-4">
      <SectionHeading
        eyebrow="Settings"
        title="Profile and role context"
        description="Review your account identity and institutional role assignment."
      />

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
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Department</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile?.department || 'Unassigned'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Role Governance</p>
            <p className="mt-2 text-sm text-slate-700">
              Roles are managed by administrators in Firestore to maintain institutional control.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
