import { useEffect, useMemo, useRef, useState } from 'react'
import { THEMES, type ResumeData } from '../types'
import {
  formatBytes,
  formatVersionTime,
  markdownCharCount,
  resumeFingerprint,
  versionsBytes,
  type ResumeVersion,
} from '../versions'

interface Props {
  open: boolean
  versions: ResumeVersion[]
  current: ResumeData
  onClose: () => void
  /** 存一份新版本；名字留空时由调用方补默认名 */
  onSaveNew: (name: string) => void
  onRestore: (version: ResumeVersion) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onExport: () => void
  onImport: (file: File) => void
  defaultName: string
}

/** 单项操作需要再点一次确认，避免误点把正在写的稿覆盖掉 */
type Pending = { id: string; kind: 'restore' | 'delete' } | null

const themeLabel = (id: string) => THEMES.find((t) => t.id === id)?.label ?? id

export default function VersionDrawer({
  open,
  versions,
  current,
  onClose,
  onSaveNew,
  onRestore,
  onDelete,
  onRename,
  onExport,
  onImport,
  defaultName,
}: Props) {
  const [name, setName] = useState('')
  const [pending, setPending] = useState<Pending>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 抽屉每次打开都回到干净状态，别把上次的确认态带进来
  useEffect(() => {
    if (!open) {
      setPending(null)
      setEditingId(null)
      setName('')
    }
  }, [open])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const currentFp = useMemo(() => resumeFingerprint(current), [current])
  const bytes = useMemo(() => versionsBytes(versions), [versions])

  if (!open) return null

  const submit = () => {
    onSaveNew(name.trim())
    setName('')
  }

  const commitRename = () => {
    if (editingId) onRename(editingId, editingName)
    setEditingId(null)
    setEditingName('')
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/45" onClick={onClose} aria-hidden />

      <aside
        role="dialog"
        aria-label="版本存档"
        className="fixed inset-y-0 right-0 z-40 w-[380px] max-w-[92vw] bg-shell border-l border-edge flex flex-col"
      >
        {/* 抬头 */}
        <div className="h-[58px] shrink-0 px-5 flex items-center justify-between border-b border-edge">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <span className="font-serif text-[17px] text-fg">版本存档</span>
            <span className="font-mono text-[9.5px] tracking-[0.12em] text-fg-3">
              {versions.length} 份
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 text-fg-3 hover:text-gold transition-colors"
            title="关闭（Esc）"
          >
            ✕
          </button>
        </div>

        {/* 存为新版本 */}
        <div className="px-5 py-4 border-b border-edge shrink-0">
          <div className="flex items-end gap-2.5">
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              placeholder={defaultName}
              aria-label="新版本名字"
              className="line-input flex-1"
            />
            <button onClick={submit} className="btn btn-solid shrink-0">
              存为版本
            </button>
          </div>
          <div className="mt-2 font-mono text-[9.5px] tracking-[0.08em] text-fg-3 leading-relaxed">
            名字可以留空，存完还能改
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="font-serif text-[13px] text-fg-2 leading-loose">
                还没有存档
              </div>
              <div className="mt-1.5 font-mono text-[9.5px] tracking-[0.08em] text-fg-3 leading-relaxed">
                针对一个岗位写完一份简历，
                <br />
                点上面「存为版本」把它留住
              </div>
            </div>
          ) : (
            versions.map((v) => {
              const isCurrent = resumeFingerprint(v.data) === currentFp
              const isPending = pending?.id === v.id
              const isEditing = editingId === v.id
              return (
                <div
                  key={v.id}
                  className="px-5 py-3 border-b border-edge/70 hover:bg-shell-alt/40 transition-colors"
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') {
                          setEditingId(null)
                          setEditingName('')
                        }
                      }}
                      onBlur={commitRename}
                      className="line-input"
                      aria-label="版本名字"
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="text-[13px] text-fg truncate" title={v.name}>
                          {v.name}
                        </div>
                        <div className="mt-1 font-mono text-[9.5px] tracking-[0.06em] text-fg-3 truncate">
                          {formatVersionTime(v.savedAt)} · {markdownCharCount(v.data.markdown)} 字 ·{' '}
                          {themeLabel(v.theme)}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="shrink-0 font-mono text-[9px] tracking-[0.1em] text-gold border border-gold/50 px-1.5 py-0.5">
                          当前
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-3.5 font-mono text-[10px] tracking-[0.06em]">
                    {isPending && pending.kind === 'restore' ? (
                      <>
                        <span className="text-alert">会覆盖现在编辑的内容</span>
                        <button
                          onClick={() => {
                            onRestore(v)
                            setPending(null)
                          }}
                          className="text-alert hover:underline"
                        >
                          确认恢复
                        </button>
                        <button
                          onClick={() => setPending(null)}
                          className="text-fg-3 hover:text-fg-2"
                        >
                          取消
                        </button>
                      </>
                    ) : isPending && pending.kind === 'delete' ? (
                      <>
                        <span className="text-alert">删掉就找不回了</span>
                        <button
                          onClick={() => {
                            onDelete(v.id)
                            setPending(null)
                          }}
                          className="text-alert hover:underline"
                        >
                          确认删除
                        </button>
                        <button
                          onClick={() => setPending(null)}
                          className="text-fg-3 hover:text-fg-2"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setPending({ id: v.id, kind: 'restore' })}
                          className="text-fg-2 hover:text-gold"
                        >
                          恢复
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(v.id)
                            setEditingName(v.name)
                          }}
                          className="text-fg-3 hover:text-fg-2"
                        >
                          改名
                        </button>
                        <button
                          onClick={() => setPending({ id: v.id, kind: 'delete' })}
                          className="text-fg-3 hover:text-alert ml-auto"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 备份：数据跟着这台电脑的这个浏览器走，换设备必须靠这个 */}
        <div className="shrink-0 px-5 py-3.5 border-t border-edge space-y-2">
          <div className="flex items-stretch gap-2.5">
            <button onClick={onExport} className="btn flex-1 justify-center" disabled={!versions.length}>
              导出备份
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn flex-1 justify-center"
            >
              导入备份
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
                e.target.value = ''
              }}
            />
          </div>
          <div className="font-mono text-[9.5px] tracking-[0.06em] text-fg-3 leading-relaxed">
            已用 {formatBytes(bytes)} / 约 5 MB · 数据存在这台电脑的浏览器里，换电脑前记得导出
          </div>
        </div>
      </aside>
    </>
  )
}
