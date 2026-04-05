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

      <div className="flex min-h-screen flex-col">
        <Topbar profile={profile} />
        <main className="content-shell pb-10">{children}</main>
      </div>
    </div>
  )
}
