'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  RiUserLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiDeleteBinLine,
  RiAlertLine,
} from 'react-icons/ri'

interface Toast { msg: string; type: 'success' | 'error' }

export default function SettingsPage() {
  const { user, loading, refetch } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (user && !initialized) {
    setName(user.name)
    setEmail(user.email)
    setInitialized(true)
  }

  const showToast = (msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const data: { name?: string; email?: string; password?: string } = {}
      if (name !== user.name) data.name = name
      if (email !== user.email) data.email = email
      if (password) data.password = password
      if (!Object.keys(data).length) { showToast('Нет изменений'); setSaving(false); return }
      await api.updateUser(user._id, data)
      setPassword('')
      await refetch()
      showToast('Данные обновлены')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Ошибка обновления', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    try {
      await api.deleteUser(user._id)
      window.location.href = 'https://orel-id.istoriyaislama.workers.dev'
    } catch { showToast('Не удалось удалить аккаунт', 'error') }
  }

  const ROLE_LABELS: Record<string, string> = {
    user: 'User', developer: 'Developer',
    developer_verified: 'Developer Verified', admin: 'Admin',
  }
  const ROLE_STYLES: Record<string, string> = {
    user: 'bg-zinc-800 text-zinc-400',
    developer: 'bg-violet-900/60 text-violet-400',
    developer_verified: 'bg-purple-900/60 text-purple-400',
    admin: 'bg-red-900/60 text-red-400',
  }

  if (loading || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72" />
        <Skeleton className="h-52" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  const inputCls = "w-full px-3 py-2.5 text-sm rounded-lg bg-dark-bg border border-dark-border text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-600 focus:border-violet-600 transition-colors placeholder-zinc-700"

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Настройки аккаунта</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Профиль разработчика OREL ID</p>
      </div>

      {/* На мобилке — вертикально, на десктопе — два столбца */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Profile form */}
        <div className="bg-dark-card rounded-xl border border-dark-border p-5">
          <div className="flex items-center gap-2 mb-5">
            <RiUserLine className="text-violet-400" />
            <h2 className="text-sm font-medium text-zinc-300">Личные данные</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Имя</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Новый пароль{' '}
                <span className="text-zinc-700 font-normal">— оставьте пустым, чтобы не менять</span>
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={inputCls} />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-5 w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 transition-colors">
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Status */}
          <div className="bg-dark-card rounded-xl border border-dark-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <RiShieldCheckLine className="text-violet-400" />
              <h2 className="text-sm font-medium text-zinc-300">Статус аккаунта</h2>
            </div>
            <div className="space-y-3">
              {[
                { k: 'Роль', v: <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLES[user.role]}`}>{ROLE_LABELS[user.role]}</span> },
                { k: 'Верификация', v: <span className="text-xs px-2.5 py-1 rounded-full bg-amber-900/40 text-amber-400 flex items-center gap-1 w-fit"><RiTimeLine className="text-xs" />В процессе</span> },
                { k: 'Файлов', v: <span className="text-xs text-zinc-300">{user.filesCount}</span> },
                { k: 'Зарегистрирован', v: <span className="text-xs text-zinc-500">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span> },
              ].map(({ k, v }) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500 flex-shrink-0">{k}</span>
                  {v}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-amber-900/20 border border-amber-800/30">
              <p className="text-xs text-amber-500 leading-relaxed">
                Заявка на верификацию на рассмотрении. После одобрения хранилище будет увеличено до 100 МБ.
              </p>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-dark-card rounded-xl border border-red-900/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <RiAlertLine className="text-red-500" />
              <h2 className="text-sm font-medium text-red-500">Опасная зона</h2>
            </div>
            <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
              Удаление аккаунта необратимо. Все файлы и данные будут удалены.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-900/20 transition-colors border border-red-900/40 w-full sm:w-auto justify-center sm:justify-start">
                <RiDeleteBinLine />
                Удалить аккаунт
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-red-400">Уверены? Это нельзя отменить.</p>
                <div className="flex gap-2">
                  <button onClick={handleDelete}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                    Да, удалить
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs text-zinc-400 hover:bg-dark-hover transition-colors border border-dark-border">
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm z-50 border ${
          toast.type === 'success' ? 'bg-dark-card border-emerald-800 text-zinc-200' : 'bg-dark-card border-red-800 text-zinc-200'
        }`}>
          {toast.type === 'success' ? <RiCheckLine className="text-emerald-400 flex-shrink-0" /> : <RiErrorWarningLine className="text-red-400 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
