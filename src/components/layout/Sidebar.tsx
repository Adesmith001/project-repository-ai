import { BookOpen, FileSearch, FolderOpenDot, LayoutDashboard, UploadCloud, Users } from 'lucide-react'
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
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white p-4">
      <div className="mb-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="rounded-lg bg-slate-900 p-2 text-white">
          <BookOpen size={18} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Project Repository</p>
          <p className="text-sm font-semibold text-slate-900">AI</p>
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
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
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
