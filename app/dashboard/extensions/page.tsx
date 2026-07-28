'use client'

import { useEffect, useState } from 'react'
import { api, StorageFile } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  RiFileZipLine,
  RiFileLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiUploadCloud2Line,
  RiInformationLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from 'react-icons/ri'

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024)
  return mb < 0.1 ? `${(bytes / 1024).toFixed(0)} КБ` : `${mb.toFixed(1)} МБ`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function parseVersion(name: string): string | null {
  const m = name.match(/[_\-]?(v?\d+\.\d+[\.\d]*)/i)
  return m ? m[1] : null
}
function getBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_\-]?v?\d+\.\d+[\.\d]*/i, '')
    .replace(/[_\-]+$/, '')
    .trim()
}

interface FileGroup { base: string; files: StorageFile[]; latest: StorageFile }

function groupFiles(files: StorageFile[]): FileGroup[] {
  const map = new Map<string, StorageFile[]>()
  for (const f of files) {
    const base = getBaseName(f.fileName)
    if (!map.has(base)) map.set(base, [])
    map.get(base)!.push(f)
  }
  return Array.from(map.entries()).map(([base, fs]) => {
    const sorted = [...fs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return { base, files: sorted, latest: sorted[0] }
  })
}

interface Toast { msg: string; type: 'success' | 'error' }

export default function ExtensionsPage() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadFiles = async () => {
    try { setFiles(await api.getMyFiles()) }
    catch { showToast('Не удалось загрузить файлы', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadFiles() }, [])

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.deleteFile(id)
      showToast(`«${name}» удалён`)
      setFiles(f => f.filter(x => x._id !== id))
    } catch { showToast('Не удалось удалить файл', 'error') }
  }

  const toggleExpand = (base: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(base) ? next.delete(base) : next.add(base)
      return next
    })
  }

  const groups = groupFiles(files)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Расширения</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Файлы из хранилища, сгруппированные по расширению</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-900/20 border border-violet-800/40">
        <RiInformationLine className="text-violet-400 text-lg flex-shrink-0 mt-0.5" />
        <p className="text-sm text-zinc-400 leading-relaxed">
          Файлы группируются по имени автоматически. Для загрузки — раздел{' '}
          <a href="/dashboard/storage" className="text-violet-400 hover:underline">Хранилище</a>.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-zinc-600">
          <RiUploadCloud2Line className="text-4xl mb-3" />
          <p className="text-sm text-zinc-400">Файлов пока нет</p>
          <p className="text-xs mt-1">
            Загрузите .orel файлы в{' '}
            <a href="/dashboard/storage" className="text-violet-400 hover:underline">хранилище</a>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(({ base, files: gFiles, latest }) => {
            const isOpen = expanded.has(base)
            const hasVersions = gFiles.length > 1
            const ver = parseVersion(latest.fileName)

            return (
              <div key={base} className="bg-dark-card rounded-xl border border-dark-border overflow-hidden">
                <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <RiFileZipLine className="text-violet-400 text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-200 truncate">{base || latest.fileName}</span>
                      {ver && (
                        <span className="text-xs font-mono bg-violet-900/40 text-violet-400 px-2 py-0.5 rounded flex-shrink-0">
                          {ver}
                        </span>
                      )}
                      {hasVersions && (
                        <span className="text-xs text-zinc-600 flex-shrink-0">{gFiles.length} версии</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-600">{formatSize(latest.size)}</span>
                      <span className="text-zinc-700 text-xs">·</span>
                      <span className="text-xs text-zinc-600">{formatDate(latest.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={latest.megaLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-2 py-1.5 rounded-lg hover:bg-violet-900/20 transition-colors">
                      <RiExternalLinkLine />
                      <span className="hidden sm:inline">Скачать</span>
                    </a>
                    {hasVersions && (
                      <button onClick={() => toggleExpand(base)}
                        className="text-xs text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-dark-hover transition-colors">
                        {isOpen ? <RiArrowUpSLine className="text-base" /> : <RiArrowDownSLine className="text-base" />}
                      </button>
                    )}
                    <button onClick={() => handleDelete(latest._id, latest.fileName)}
                      className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                      <RiDeleteBinLine className="text-base" />
                    </button>
                  </div>
                </div>

                {isOpen && hasVersions && (
                  <div className="border-t border-dark-border bg-dark-bg/40 px-4 sm:px-5 py-3">
                    <p className="text-xs text-zinc-600 mb-2">Предыдущие версии</p>
                    <div className="space-y-1">
                      {gFiles.slice(1).map(f => {
                        const fVer = parseVersion(f.fileName)
                        return (
                          <div key={f._id} className="flex items-center gap-2 sm:gap-3 py-2 px-2 rounded-lg hover:bg-dark-hover transition-colors">
                            <RiFileLine className="text-zinc-600 text-sm flex-shrink-0" />
                            <span className="font-mono text-xs text-zinc-500 flex-1 truncate">{f.fileName}</span>
                            {fVer && <span className="text-xs font-mono text-zinc-700 hidden sm:inline">{fVer}</span>}
                            <span className="text-xs text-zinc-700 hidden sm:inline">{formatSize(f.size)}</span>
                            <span className="text-xs text-zinc-700 hidden sm:inline">{formatDate(f.createdAt)}</span>
                            <a href={f.megaLink} target="_blank" rel="noopener noreferrer"
                              className="text-zinc-600 hover:text-violet-400 transition-colors p-1">
                              <RiExternalLinkLine className="text-sm" />
                            </a>
                            <button onClick={() => handleDelete(f._id, f.fileName)}
                              className="text-zinc-700 hover:text-red-400 transition-colors p-1">
                              <RiDeleteBinLine className="text-sm" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm z-50 border ${
          toast.type === 'success' ? 'bg-dark-card border-emerald-800 text-zinc-200' : 'bg-dark-card border-red-800 text-zinc-200'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
