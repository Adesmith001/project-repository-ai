import { BookOpen, FileSearch, FolderOpenDot, LayoutDashboard, Settings, UploadCloud, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { UserRole } from '../../types'
import { cn } from '../../utils/cn'

interface SidebarProps {
  role: UserRole
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles: UserRole[]
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['student', 'supervisor', 'admin'],
  },
  {
    to: '/projects',
    label: 'Repository',
    icon: FolderOpenDot,
    roles: ['student', 'supervisor', 'admin'],
  },
  {
    to: '/check-topic',
    label: 'Topic Checker',
    icon: FileSearch,
    roles: ['student', 'admin'],
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['student', 'supervisor', 'admin'],
  },
  {
    to: '/upload-project',
    label: 'Upload Project',
    icon: UploadCloud,
    roles: ['admin'],
  },
  {
    to: '/admin/users',
    label: 'Manage Users',
    icon: Users,
    roles: ['admin'],
  },
]

export function Sidebar({ role }: SidebarProps) {
  return (
    <aside className="ink-panel m-4 flex h-[calc(100vh-2rem)] w-68 flex-col rounded-3xl p-4 text-slate-200 shadow-[0_26px_56px_rgba(15,23,42,0.32)]">
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div className="rounded-xl bg-linear-to-br from-teal-500 to-cyan-400 p-2 text-slate-950">
          <BookOpen size={18} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Research Platform</p>
          <p className="brand-wordmark text-lg text-white">AI REPO</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200',
                    isActive
                      ? 'bg-white/12 text-white ring-1 ring-teal-300/50 shadow-sm'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
      </nav>

      <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
        <p className="font-semibold text-slate-100">Uniform design system active</p>
        <p className="mt-1">AI REPO workspace for discovery, originality, and governance.</p>
      </div>
    </aside>
  )
}
