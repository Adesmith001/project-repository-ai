import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { UserProfile } from '../../types'

interface AppShellProps {
  profile: UserProfile
  children: ReactNode
}

export function AppShell({ profile, children }: AppShellProps) {
  return (
    <div className="app-shell-grid min-h-screen bg-transparent text-slate-900">
      <div className="hidden xl:block">
        <Sidebar role={profile.role} />
      </div>

      <div className="m-4 flex min-h-[calc(100vh-2rem)] flex-col rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)] xl:ml-0">
        <Topbar profile={profile} />
        <main className="content-shell pb-10">{children}</main>
      </div>
    </div>
  )
}
