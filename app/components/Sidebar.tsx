'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FolderOpen, Plus, X, Users } from 'lucide-react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { UserRole } from '@prisma/client'

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { data: session } = useSession()
  
  // Todos os usuários têm acesso a organizações
  const isAdmin = session?.user?.role === UserRole.ADMIN

  const menuItems = [
    { href: '/dashboard', label: 'Home', icon: Home, testId: 'dashboard' },
    { href: '/projects', label: 'Projects', icon: FolderOpen, testId: 'projects' },
    { href: '/new-project', label: 'New Project', icon: Plus, testId: 'new-project' },
    ...(isAdmin ? [{ href: '/users', label: 'Users', icon: Users, testId: 'users' }] : []),
  ]

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        data-testid="sidebar"
        className={`fixed left-0 top-0 h-full w-64 text-white transition-transform duration-300 z-50 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="relative h-full overflow-hidden border-r border-white/10 bg-white/5 backdrop-blur">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative z-10 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image  src="/Logo.png" alt="Saveenv" width={32} height={32} className='w-8 h-8 text-indigo-300'/>
                <span className="text-xl font-bold tracking-tight">Saveenv</span>
              </div>
              <button
                data-testid="close-mobile-menu"
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <nav data-testid="sidebar-navigation" className="relative z-10 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`nav-link-${item.testId}`}
                  onClick={() => setIsMobileOpen(false)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition duration-200 ${
                    active
                      ? 'bg-white/10 border-r-4 border-indigo-400 text-white'
                      : 'hover:bg-white/5 text-white/85'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <button
        data-testid="mobile-menu-button"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed left-3 top-3 z-30 rounded-lg bg-white/90 px-2 py-2 text-slate-900 shadow"
        aria-label="Open menu"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}