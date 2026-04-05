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
    <aside className="frosted-surface m-4 flex h-[calc(100vh-2rem)] w-65 flex-col rounded-[22px] p-4">
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
        <div className="rounded-xl bg-slate-950 p-2 text-white">
          <BookOpen size={18} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Project Repository</p>
          <p className="text-sm font-bold text-slate-900">AI Workspace</p>
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
                    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200',
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white hover:shadow-sm',
                  )
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
      </nav>
    </aside>
  )
}
