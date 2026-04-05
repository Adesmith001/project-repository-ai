import { LogOut, Search, User2 } from 'lucide-react'
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
    { to: '/settings', label: 'Settings', roles: ['student', 'supervisor', 'admin'] },
    { to: '/upload-project', label: 'Upload', roles: ['admin'] },
    { to: '/admin/users', label: 'Users', roles: ['admin'] },
  ].filter((item) => (role ? item.roles.includes(role) : false))

  return (
    <header className="sticky top-0 z-20 px-4 py-4 sm:px-6">
      <div className="frosted-surface flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Project Repository AI</h1>
          <p className="text-xs text-slate-500">AI-powered originality and research intelligence</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 lg:flex">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search projects, topics, supervisors"
              className="w-64 border-none bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 md:flex">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.fullName}
                className="h-8 w-8 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500">
                <User2 size={15} className="text-slate-500" />
              </span>
            )}
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
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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
