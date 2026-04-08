import { FileSearch, FolderOpenDot, LayoutDashboard, LogOut, Settings, UploadCloud, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { UserRole } from '../../types'
import { cn } from '../../utils/cn'
import { useAppDispatch } from '../../hooks/useAppStore'
import { logoutThunk } from '../../features/auth/authSlice'

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
    roles: ['student', 'supervisor', 'admin'],
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
    roles: ['student', 'supervisor', 'admin'],
  },
  {
    to: '/admin/users',
    label: 'Manage Users',
    icon: Users,
    roles: ['supervisor', 'admin'],
  },
]

export function Sidebar({ role }: SidebarProps) {
  const dispatch = useAppDispatch()

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  const coreItems = visibleItems.filter((item) => item.to === '/dashboard' || item.to === '/projects' || item.to === '/check-topic')
  const adminItems = visibleItems.filter((item) => item.to === '/upload-project' || item.to === '/admin/users')

  return (
    <aside className="m-4 flex h-[calc(100dvh-2rem)] w-64 flex-col rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
      <div className="mb-6 px-2">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white">
            AI
          </span>
          <p className="brand-wordmark text-lg text-slate-900">AI REPO</p>
        </div>
        <p className="text-xs text-slate-500">Research management workspace</p>
      </div>

      <div className="space-y-2">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <nav className="space-y-1">
          {coreItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-200',
                    isActive
                      ? 'border-blue-100 bg-blue-50 text-blue-700'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {adminItems.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Administration</p>
          <nav className="space-y-1">
            {adminItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-200',
                      isActive
                        ? 'border-blue-100 bg-blue-50 text-blue-700'
                        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
                    )
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      ) : null}

      <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-200',
              isActive
                ? 'border-blue-100 bg-blue-50 text-blue-700'
                : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
            )
          }
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>

        <button
          type="button"
          onClick={() => {
            void dispatch(logoutThunk())
          }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
