import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, LogOut, Search, Settings, User2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { logoutThunk } from '../../features/auth/authSlice'
import { useAppDispatch } from '../../hooks/useAppStore'
import type { UserProfile, UserRole } from '../../types'

interface TopbarProps {
  profile: UserProfile | null
  authorizedRole: UserRole
}

export function Topbar({ profile, authorizedRole }: TopbarProps) {
  const dispatch = useAppDispatch()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const roleLabel = authorizedRole === 'student' && profile?.role === 'supervisor'
    ? 'Supervisor restricted'
    : authorizedRole

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

          <div ref={menuRef} className="relative xl:hidden">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((value) => !value)}
            >
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
              <div className="hidden text-left text-xs sm:block">
                <p className="max-w-28 truncate font-semibold text-slate-800">{profile?.fullName || 'Unknown User'}</p>
                <p className="capitalize text-slate-500">{roleLabel}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_44px_rgba(15,23,42,0.14)]">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{profile?.fullName || 'Unknown User'}</p>
                  <p className="truncate text-xs text-slate-500">{profile?.email || 'No email available'}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{roleLabel}</p>
                </div>

                <div className="mt-2 space-y-1">
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings size={15} />
                    <span>Settings</span>
                  </Link>

                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      setMenuOpen(false)
                      void dispatch(logoutThunk())
                    }}
                  >
                    <LogOut size={15} />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 xl:flex">
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
              <p className="capitalize text-slate-500">{roleLabel}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  )
}
