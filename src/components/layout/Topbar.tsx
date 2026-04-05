import { LogOut, User2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/useAppStore'
import { logoutThunk } from '../../features/auth/authSlice'
import type { UserProfile } from '../../types'

export function Topbar({ profile }: { profile: UserProfile | null }) {
  const dispatch = useAppDispatch()
  const role = profile?.role

  const quickLinks = [
    { to: '/dashboard', label: 'Dashboard', roles: ['student', 'supervisor', 'admin'] },
    { to: '/projects', label: 'Repository', roles: ['student', 'supervisor', 'admin'] },
    { to: '/check-topic', label: 'Topic Checker', roles: ['student', 'admin'] },
    { to: '/upload-project', label: 'Upload', roles: ['admin'] },
    { to: '/admin/users', label: 'Users', roles: ['admin'] },
  ].filter((item) => (role ? item.roles.includes(role) : false))

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Project Repository AI</h1>
          <p className="text-xs text-slate-500">Originality-aware project repository and recommendation system</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
            <User2 size={16} className="text-slate-500" />
            <div className="text-xs">
              <p className="font-semibold text-slate-800">{profile?.fullName || 'Unknown User'}</p>
              <p className="capitalize text-slate-500">{profile?.role || 'visitor'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void dispatch(logoutThunk())
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
