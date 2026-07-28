'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api, StorageFile } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  RiUploadCloud2Line,
  RiDeleteBinLine,
  RiFileZipLine,
  RiFileLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiExternalLinkLine,
} from 'react-icons/ri'

type ExpiryOption = '15d' | '30d' | 'never'
const EXPIRY_LABELS: Record<ExpiryOption, string> = {
  '15d': '15 дней', '30d': '30 дней', 'never': 'Без срока',
}
const EXPIRY_STYLES: Record<ExpiryOption, string> = {
  '15d': 'bg-red-900/40 text-red-400',
  '30d': 'bg-amber-900/40 text-amber-400',
  'never': 'bg-emerald-900/40 text-emerald-400',
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024)
  return mb < 0.1 ? `${(bytes / 1024).toFixed(0)} КБ` : `${mb.toFixed(1)} МБ`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function isZip(name: string) {
  return /\.(zip|tar|gz|rar|7z|orel)$/i.test(name)
}

interface Toast { msg: string; type: 'success' | 'error' }

export default function StoragePage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [storageLimit, setStorageLimit] = useState<number>(50 * 1024 * 1024)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [expiryMap, setExpiryMap] = useState<Record<string, ExpiryOption>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadFiles = async () => {
    try {
      const data = await api.getMyFiles()
      setFiles(data)
    } catch {
      showToast('Не удалось загрузить файлы', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      setStorageLimit(user.role === 'developer_verified' ? 100 * 1024 * 1024 : 50 * 1024 * 1024)
    }
    loadFiles()
  }, [user])

  const usedBytes = files.reduce((sum, f) => sum + f.size, 0)
  const limitMB = storageLimit / (1024 * 1024)
  const usedMB = usedBytes / (1024 * 1024)
  const freeMB = limitMB - usedMB
  const usedPct = Math.min(Math.round((usedMB / limitMB) * 100), 100)

  const isOrelFile = (file: File) => file.name.endsWith('.orle')

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      await api.uploadFile(file)
      showToast(`«${file.name}» загружен`)
      await loadFiles()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Ошибка загрузки', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.deleteFile(id)
      showToast(`«${name}» удалён`)
      setFiles(f => f.filter(x => x._id !== id))
    } catch {
      showToast('Не удалось удалить файл', 'error')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!isOrelFile(file)) {
      showToast('Только файлы с расширением .orle', 'error')
      return
    }
    handleUpload(file)
  }

  const setExpiry = (id: string, val: ExpiryOption) => {
    setExpiryMap(m => ({ ...m, [id]: val }))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Хранилище</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Управление файлами</p>
      </div>

      {/* Storage bar */}
      <div className="bg-dark-card rounded-xl border border-dark-border p-4 sm:p-5">
        {loading ? <Skeleton className="h-12" /> : (
          <>
            <div className="flex items-baseline justify-between mb-2 gap-2">
              <span className="text-sm font-medium text-zinc-300">Хранилище</span>
              <span className="text-xs text-zinc-500 text-right">
                {usedMB.toFixed(1)} МБ / {limitMB} МБ
              </span>
            </div>
            <div className="h-2.5 bg-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${usedPct > 85 ? 'bg-red-500' : 'bg-violet-600'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-2.5">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-600" />
                Занято — {usedMB.toFixed(1)} МБ
              </span>
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full border border-zinc-600" />
                Свободно — {freeMB.toFixed(1)} МБ
              </span>
            </div>
          </>
        )}
      </div>

      {/* Upload zone */}
      <div
        className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          dragOver ? 'border-violet-500 bg-violet-900/10' : 'border-dark-border hover:border-violet-700 hover:bg-violet-900/5'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".orle"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            if (!isOrelFile(f)) {
              showToast('Только файлы с расширением .orle', 'error')
              e.target.value = ''
              return
            }
            handleUpload(f)
            e.target.value = ''
          }}
        />
        <div className="flex flex-col items-center py-8 gap-2">
          <RiUploadCloud2Line className={`text-3xl transition-colors ${dragOver ? 'text-violet-400' : 'text-zinc-600'}`} />
          <p className="text-sm text-zinc-400 text-center px-4">
            {uploading ? 'Загрузка...' : 'Перетащите файл или нажмите для выбора'}
          </p>
          <p className="text-xs text-zinc-600">
            Только <span className="font-mono text-zinc-500">.orle</span> · Свободно: {freeMB.toFixed(1)} МБ
          </p>
        </div>
      </div>

      {/* Files */}
      <div className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-dark-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">Файлы</h2>
          <span className="text-xs text-zinc-600">{files.length} шт.</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-zinc-600">
            <RiFileLine className="text-3xl mb-2" />
            <p className="text-sm">Файлов нет</p>
            <p className="text-xs mt-1">Загрузите .orle файл через форму выше</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-600 border-b border-dark-border">
                    <th className="text-left px-5 py-2.5 font-medium w-10"></th>
                    <th className="text-left px-2 py-2.5 font-medium">Имя файла</th>
                    <th className="text-left px-2 py-2.5 font-medium">Размер</th>
                    <th className="text-left px-2 py-2.5 font-medium">Срок хранения</th>
                    <th className="text-left px-2 py-2.5 font-medium">Дата</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => {
                    const expiry: ExpiryOption = expiryMap[file._id] ?? '30d'
                    return (
                      <tr key={file._id} className="border-b border-dark-border last:border-0 hover:bg-dark-hover transition-colors">
                        <td className="px-5 py-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-900/30 flex items-center justify-center">
                            {isZip(file.fileName)
                              ? <RiFileZipLine className="text-violet-400 text-sm" />
                              : <RiFileLine className="text-zinc-400 text-sm" />}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <a href={file.megaLink} target="_blank" rel="noopener noreferrer"
                            className="font-mono text-xs text-zinc-200 hover:text-violet-400 transition-colors flex items-center gap-1 group">
                            {file.fileName}
                            <RiExternalLinkLine className="text-zinc-600 group-hover:text-violet-400 transition-colors" />
                          </a>
                        </td>
                        <td className="px-2 py-3 text-zinc-500 text-xs">{formatSize(file.size)}</td>
                        <td className="px-2 py-3">
                          <select value={expiry} onChange={e => setExpiry(file._id, e.target.value as ExpiryOption)}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer appearance-none ${EXPIRY_STYLES[expiry]} bg-transparent`}>
                            {Object.entries(EXPIRY_LABELS).map(([k, v]) => (
                              <option key={k} value={k} className="bg-dark-card text-zinc-200">{v}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3 text-zinc-600 text-xs">{formatDate(file.createdAt)}</td>
                        <td className="pr-4">
                          <button onClick={() => handleDelete(file._id, file.fileName)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                            <RiDeleteBinLine className="text-base" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-dark-border">
              {files.map(file => {
                const expiry: ExpiryOption = expiryMap[file._id] ?? '30d'
                return (
                  <div key={file._id} className="px-4 py-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {isZip(file.fileName)
                        ? <RiFileZipLine className="text-violet-400 text-base" />
                        : <RiFileLine className="text-zinc-400 text-base" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={file.megaLink} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-zinc-200 hover:text-violet-400 flex items-center gap-1 truncate">
                        {file.fileName}
                        <RiExternalLinkLine className="text-zinc-600 flex-shrink-0" />
                      </a>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs text-zinc-600">{formatSize(file.size)}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-xs text-zinc-600">{formatDate(file.createdAt)}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${EXPIRY_STYLES[expiry]}`}>
                          {EXPIRY_LABELS[expiry]}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(file._id, file.fileName)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0">
                      <RiDeleteBinLine className="text-base" />
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
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
