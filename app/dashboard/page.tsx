'use client'

import { useAuth } from '@/lib/auth-context'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  RiUserLine,
  RiFlashlightLine,
  RiFolderLine,
  RiCalendarLine,
  RiArrowUpLine,
  RiShieldCheckLine,
} from 'react-icons/ri'

export default function StatsPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!user) return null

  const joinedDate = new Date(user.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const METRICS = [
    { label: 'Имя', value: user.name, sub: user.email, icon: RiUserLine, accent: 'text-violet-400', bg: 'bg-violet-900/30' },
    { label: 'Роль', value: user.role === 'developer_verified' ? 'Dev Verified' : user.role.charAt(0).toUpperCase() + user.role.slice(1), sub: user.isAdmin ? 'Администратор' : 'Разработчик', icon: RiFlashlightLine, accent: 'text-purple-400', bg: 'bg-purple-900/30' },
    { label: 'Файлов', value: String(user.filesCount), sub: 'в хранилище', icon: RiFolderLine, accent: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Создан', value: joinedDate, sub: 'дата регистрации', icon: RiCalendarLine, accent: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  ]

  const ROLE_STYLES: Record<string, string> = {
    user: 'bg-zinc-800 text-zinc-400',
    developer: 'bg-violet-900/60 text-violet-400',
    developer_verified: 'bg-purple-900/60 text-purple-400',
    admin: 'bg-red-900/60 text-red-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Привет, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Ваш Developer Portal — OREL ID</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {METRICS.map(({ label, value, sub, icon: Icon, accent, bg }) => (
          <div key={label} className="bg-dark-card rounded-xl border border-dark-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-white truncate">{value}</p>
                <p className="text-xs text-zinc-600 mt-0.5 truncate">{sub}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`text-sm ${accent}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-dark-card rounded-xl border border-dark-border p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <RiUserLine className="text-violet-400" />
            Профиль разработчика
          </h2>
          <div className="space-y-3">
            {[
              { k: 'Email', v: user.email },
              { k: 'Роль', v: user.role },
              { k: 'Обновлён', v: new Date(user.updatedAt).toLocaleDateString('ru-RU') },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between items-center gap-3">
                <span className="text-xs text-zinc-500 flex-shrink-0">{k}</span>
                <span className="text-xs font-mono text-zinc-300 truncate text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-card rounded-xl border border-dark-border p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <RiShieldCheckLine className="text-emerald-400" />
            Статус аккаунта
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Верификация</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400">В процессе</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Хранилище</span>
              <span className="text-xs text-zinc-300">{user.role === 'developer_verified' ? '100 МБ' : '50 МБ'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Файлов</span>
              <span className="text-xs text-zinc-300">{user.filesCount} шт.</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Роль</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
