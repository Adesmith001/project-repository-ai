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
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <div className="hidden lg:block">
        <Sidebar role={profile.role} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar profile={profile} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
