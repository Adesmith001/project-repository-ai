import { Bell, ChevronDown, Search, User2 } from 'lucide-react'
import type { UserProfile } from '../../types'

export function Topbar({ profile }: { profile: UserProfile | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/96 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, topics, supervisors"
            className="w-72 border-none bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
            aria-label="Notifications"
          >
            <Bell size={15} />
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 md:flex">
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
              <p className="max-w-32.5 truncate font-semibold text-slate-800">{profile?.fullName || 'Unknown User'}</p>
              <p className="capitalize text-slate-500">{profile?.role || 'visitor'}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  )
}
