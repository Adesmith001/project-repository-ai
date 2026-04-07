import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FolderOpenDot,
  Home,
  Search,
  UploadCloud,
  User,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { UserRole } from '../../types'
import { cn } from '../../utils/cn'

const MOBILE_LABEL_WIDTH = 84

type BottomNavItem = {
  label: string
  icon: typeof Home
  to: string
  roles: UserRole[]
}

const navItems: BottomNavItem[] = [
  { label: 'Home', icon: Home, to: '/dashboard', roles: ['student', 'supervisor', 'admin'] },
  { label: 'Repository', icon: FolderOpenDot, to: '/projects', roles: ['student', 'supervisor', 'admin'] },
  { label: 'Topic', icon: Search, to: '/check-topic', roles: ['student', 'supervisor', 'admin'] },
  { label: 'Upload', icon: UploadCloud, to: '/upload-project', roles: ['student', 'supervisor', 'admin'] },
  { label: 'Users', icon: Users, to: '/admin/users', roles: ['supervisor', 'admin'] },
  { label: 'Settings', icon: User, to: '/settings', roles: ['student', 'supervisor', 'admin'] },
]

type BottomNavBarProps = {
  className?: string
  stickyBottom?: boolean
  role: UserRole
}

export function BottomNavBar({ className, stickyBottom = false, role }: BottomNavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const visibleItems = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role])

  return (
    <motion.nav
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        'flex h-13 min-w-[320px] max-w-[95vw] items-center space-x-1 rounded-full border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur',
        stickyBottom && 'fixed inset-x-0 bottom-4 z-30 mx-auto w-fit',
        className,
      )}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

        return (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'relative flex h-10 min-h-10 min-w-11 max-h-11 items-center gap-0 rounded-full px-3 py-2 transition-colors duration-200',
              isActive
                ? 'gap-2 bg-teal-50 text-teal-700'
                : 'bg-transparent text-slate-500 hover:bg-slate-100',
              'focus:outline-none',
            )}
            onClick={() => navigate(item.to)}
            aria-label={item.label}
            type="button"
          >
            <Icon size={20} strokeWidth={2} aria-hidden className="transition-colors duration-200" />

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${MOBILE_LABEL_WIDTH}px` : '0px',
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? '8px' : '0px',
              }}
              transition={{
                width: { type: 'spring', stiffness: 320, damping: 30 },
                opacity: { duration: 0.18 },
                marginLeft: { duration: 0.18 },
              }}
              className="flex max-w-21 items-center overflow-hidden"
            >
              <span
                className={cn(
                  'select-none overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium leading-[1.9] transition-opacity duration-200',
                  isActive ? 'text-teal-700' : 'opacity-0',
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        )
      })}
    </motion.nav>
  )
}

export default BottomNavBar
