'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  RiBarChartBoxLine,
  RiFolderLine,
  RiPuzzleLine,
  RiSettings3Line,
  RiMenuLine,
  RiCloseLine,
} from 'react-icons/ri'
import { UserRole } from '@/lib/api'

const NAV = [
  { href: '/dashboard',            label: 'Статистика',  icon: RiBarChartBoxLine, exact: true },
  { href: '/dashboard/storage',    label: 'Хранилище',   icon: RiFolderLine },
  { href: '/dashboard/extensions', label: 'Расширения',  icon: RiPuzzleLine },
  { href: '/dashboard/settings',   label: 'Аккаунт',     icon: RiSettings3Line },
]

const ROLE_LABELS: Record<UserRole, { label: string; cls: string }> = {
  user:               { label: 'User',         cls: 'bg-zinc-800 text-zinc-400' },
  developer:          { label: 'Developer',    cls: 'bg-violet-900/60 text-violet-400' },
  developer_verified: { label: 'Dev Verified', cls: 'bg-purple-900/60 text-purple-400' },
  admin:              { label: 'Admin',        cls: 'bg-red-900/60 text-red-400' },
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const roleInfo = user ? ROLE_LABELS[user.role] : null

  return (
    <>
      <header className="sticky top-0 z-40 bg-dark-surface border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <span className="font-semibold text-sm text-white">
              OREL ID <span className="font-normal text-zinc-500">Developer</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-violet-600/20 text-violet-400 font-medium'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-dark-hover'
                  }`}>
                  <Icon className="text-base" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* User info — desktop */}
            {user && (
              <div className="hidden sm:flex items-center gap-2.5">
                {roleInfo && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleInfo.cls}`}>
                    {roleInfo.label}
                  </span>
                )}
                <div className="w-8 h-8 rounded-full bg-violet-900/60 flex items-center justify-center text-xs font-semibold text-violet-400">
                  {getInitials(user.name)}
                </div>
              </div>
            )}
            {/* Burger */}
            <button
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-hover transition-colors"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Меню"
            >
              {menuOpen ? <RiCloseLine className="text-xl" /> : <RiMenuLine className="text-xl" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          {/* Panel */}
          <div className="absolute top-14 left-0 right-0 bg-dark-surface border-b border-dark-border px-4 py-3 space-y-1">
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-dark-border">
                <div className="w-9 h-9 rounded-full bg-violet-900/60 flex items-center justify-center text-sm font-semibold text-violet-400">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
                {roleInfo && (
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${roleInfo.cls}`}>
                    {roleInfo.label}
                  </span>
                )}
              </div>
            )}
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link key={href} href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-violet-600/20 text-violet-400 font-medium'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-dark-hover'
                  }`}>
                  <Icon className="text-lg" />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
