import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNavBar } from '../ui/bottom-nav-bar'
import type { UserProfile } from '../../types'

interface AppShellProps {
  profile: UserProfile
  children: ReactNode
}

export function AppShell({ profile, children }: AppShellProps) {
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  return (
    <div className="app-shell-grid h-dvh overflow-hidden bg-transparent text-slate-900">
      <div className="hidden h-dvh xl:block">
        <Sidebar role={profile.role} />
      </div>

      <div className="m-4 flex h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)] xl:ml-0">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto pb-20 xl:pb-4">
          <div className="content-shell">{children}</div>
        </main>
        <div className="xl:hidden">
          <BottomNavBar role={profile.role} stickyBottom />
        </div>
      </div>
    </div>
  )
}
