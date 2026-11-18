import { useEffect, useRef, useState, useCallback, type MouseEvent as ReactMouseEvent } from 'react'
import { toPng, toBlob } from 'html-to-image'
import Header from './components/Header'
import EditorPanel from './components/EditorPanel'
import ResumePreview from './components/ResumePreview'
import Ruler from './components/Ruler'
import { A4_HEIGHT_PX, pageFit } from './pagefit'
import { DEFAULT_DATA, THEMES, type ResumeData, type ThemeId } from './types'
import { loadJSON, saveJSON, saveJSONOk } from './storage'
import { isOversized, resizeDataUrl } from './photo'
import { exportFileName } from './export-name'
import { DEFAULT_SHELL, isShellId, type ShellId } from './shell'
import { LAYOUT_KEY, parseLayout, type LayoutTune } from './layout'
import VersionDrawer from './components/VersionDrawer'
import LayoutPanel from './components/LayoutPanel'
import {
  VERSIONS_KEY,
  backupPayload,
  dateStamp,
  defaultVersionName,
  findSameVersion,
  mergeVersions,
  newVersionId,
  parseVersions,
  removeVersion,
  renameVersion,
  upsertVersion,
  type ResumeVersion,
} from './versions'

const STORAGE_KEY = 'resume-assistant-data'
const THEME_KEY = 'resume-assistant-theme'
/** 外壳（工具界面配色）的持久化键，index.html 的首帧脚本读同一个键 */
const SHELL_KEY = 'resume-assistant-shell'
/** 纸面宽度（210mm @96dpi），用于按缩放比例确定预览占位尺寸 */
const PAPER_W = 793.7

function loadData(): ResumeData {
  const raw = loadJSON(STORAGE_KEY)
  if (raw) {
    try {
      return { ...DEFAULT_DATA, ...JSON.parse(raw) }
    } catch {
      /* 数据损坏时回退默认 */
    }
  }
  return DEFAULT_DATA
}

function loadTheme(): ThemeId {
  const t = loadJSON(THEME_KEY)
  return THEMES.some((x) => x.id === t) ? (t as ThemeId) : 'tech'
}

/** 读上次选的外壳；读不到或值不认识就用默认的深海军蓝 */
function loadShell(): ShellId {
  const s = loadJSON(SHELL_KEY)
  return isShellId(s) ? s : DEFAULT_SHELL
}

/** 读本地存档的版本列表；坏数据在 parseVersions 里逐条筛掉 */
function loadVersions(): ResumeVersion[] {
  return parseVersions(loadJSON(VERSIONS_KEY))
}

export default function App() {
  const [data, setData] = useState<ResumeData>(loadData)
  const [theme, setTheme] = useState<ThemeId>(loadTheme)
  const [shell, setShell] = useState<ShellId>(loadShell)
  const [saved, setSaved] = useState(false)
  const [pages, setPages] = useState(1)
  const [panelW, setPanelW] = useState(366)
  const [scale, setScale] = useState(0.8)
  const [paperH, setPaperH] = useState(A4_HEIGHT_PX)
  const [versions, setVersions] = useState<ResumeVersion[]>(loadVersions)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [versionMsg, setVersionMsg] = useState<string | null>(null)
  const [layout, setLayout] = useState<LayoutTune>(() => parseLayout(loadJSON(LAYOUT_KEY)))
  const [layoutOpen, setLayoutOpen] = useState(false)
  const resumeRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  // 预览纸面宽度自适应：面板变窄时自动等比缩小，永不裁切
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    // 让出左侧页尺与四周留白
    const update = () => setScale(Math.min(0.8, Math.max(0.3, (el.clientWidth - 156) / PAPER_W)))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 左右面板拖拽调宽
  const startDrag = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = panelW
      const onMove = (ev: MouseEvent) => {
        const max = Math.max(280, window.innerWidth - 300)
        setPanelW(Math.min(max, Math.max(280, startW + ev.clientX - startX)))
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [panelW],
  )

  const patch = useCallback((p: Partial<ResumeData>) => {
    setData((d) => ({ ...d, ...p }))
    setSaved(false)
  }, [])

  const changeTheme = useCallback((t: ThemeId) => {
    setTheme(t)
    saveJSON(THEME_KEY, t)
  }, [])

  // 外壳配色挂在 <html data-shell> 上，CSS 变量据此整套换掉
  useEffect(() => {
    document.documentElement.dataset.shell = shell
  }, [shell])

  const changeShell = useCallback((s: ShellId) => {
    setShell(s)
    saveJSON(SHELL_KEY, s)
  }, [])

  /** 排版微调：内存态立即生效，同时持久化到本机浏览器 */
  const changeLayout = useCallback((next: LayoutTune) => {
    setLayout(next)
    saveJSON(LAYOUT_KEY, JSON.stringify(next))
  }, [])

  /** 顶部提示一句，2.6 秒后自己消失 */
  const flashTimer = useRef<number | null>(null)
  const flash = useCallback((msg: string) => {
    setVersionMsg(msg)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setVersionMsg(null), 2600)
  }, [])

  const save = useCallback(() => {
    // 必须如实回报成功与否：写不进去时如果还说「已保存」，用户会以为存好了
    if (!saveJSONOk(STORAGE_KEY, JSON.stringify(data))) {
      flash('存不进去：浏览器存储空间满了。先「导出备份」，再删掉旧存档腾地方')
      return
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }, [data, flash])

  /** 落盘版本列表；写失败多半是 localStorage 配额满了，必须明说下一步怎么办 */
  const persistVersions = useCallback(
    (next: ResumeVersion[], okMsg: string) => {
      if (!saveJSONOk(VERSIONS_KEY, JSON.stringify(next))) {
        flash('存不进去：浏览器存储空间满了。先「导出备份」再删旧存档；照片太大也会这样，重选一次照片会自动压小')
        return
      }
      setVersions(next)
      flash(okMsg)
    },
    [flash],
  )

  /**
   * 老用户存过原图照片：原图动辄 3–5 MB，一份就吃掉全部配额，
   * 之后存版本永远存不进去。打开页面时自动收拾一遍：
   *   · 存档里的照片过大 → 去掉照片，文字内容都留着（恢复时用当前的照片）
   *   · 当前照片过大 → 压小后立刻落盘
   * 只在启动时做一次。
   */
  useEffect(() => {
    let cancelled = false
    const tidy = async () => {
      const heavy = versions.some((v) => isOversized(v.data.photo))
      if (heavy) {
        const trimmed = versions.map((v) =>
          isOversized(v.data.photo) ? { ...v, data: { ...v.data, photo: null } } : v,
        )
        if (saveJSONOk(VERSIONS_KEY, JSON.stringify(trimmed))) setVersions(trimmed)
      }
      if (!isOversized(data.photo)) return
      try {
        const small = await resizeDataUrl(data.photo as string)
        if (cancelled) return
        const next = { ...data, photo: small }
        setData(next)
        saveJSONOk(STORAGE_KEY, JSON.stringify(next))
        flash('照片太大，已经自动压小了一次，现在能正常存版本了')
      } catch {
        /* 压不了就算了，不打断使用 */
      }
    }
    void tidy()
    return () => {
      cancelled = true
    }
    // 只在启动时收拾一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveNewVersion = useCallback(
    (name: string) => {
      // 内容一模一样就不新增记录，只刷新那条的名字和时间，免得几十份重复存档吃掉配额
      const same = findSameVersion(versions, data)
      const version: ResumeVersion = {
        id: same?.id ?? newVersionId(),
        name: name.trim() || same?.name || defaultVersionName(data),
        savedAt: Date.now(),
        theme,
        data,
      }
      persistVersions(
        upsertVersion(versions, version),
        same ? `内容没变，已更新「${version.name}」` : `已存为「${version.name}」`,
      )
    },
    [data, theme, versions, persistVersions],
  )

  /** 把当前内容留一份；已有同样内容就不重复存。返回是否真的存了 */
  const archiveSnapshot = useCallback(
    (msgPrefix: string | null, label?: string) => {
      if (findSameVersion(versions, data)) return false
      const version: ResumeVersion = {
        id: newVersionId(),
        name: label ? `${label} · ${dateStamp()}` : defaultVersionName(data),
        savedAt: Date.now(),
        theme,
        data,
      }
      const next = upsertVersion(versions, version)
      // 留档失败不该挡住主操作（导出 / 恢复），静默放行
      if (!saveJSONOk(VERSIONS_KEY, JSON.stringify(next))) return false
      setVersions(next)
      if (msgPrefix) flash(`${msgPrefix}「${version.name}」`)
      return true
    },
    [versions, data, theme, flash],
  )

  const archiveBeforeExport = useCallback(() => {
    archiveSnapshot('导出前已自动留档')
  }, [archiveSnapshot])

  const restoreVersion = useCallback(
    (version: ResumeVersion) => {
      // 恢复会覆盖当前编辑的内容，先把它留一份，免得用户白写
      const kept = archiveSnapshot(null, '恢复前的草稿')
      // 老存档可能缺字段，和默认数据合并后再灌进表单
      const next = { ...DEFAULT_DATA, ...version.data }
      setData(next)
      setTheme(version.theme)
      saveJSON(THEME_KEY, version.theme)
      // 恢复完直接落盘：否则关掉页面，这一趟恢复就白恢复了
      const ok = saveJSONOk(STORAGE_KEY, JSON.stringify(next))
      if (ok) {
        setSaved(true)
        window.setTimeout(() => setSaved(false), 2000)
      }
      setDrawerOpen(false)
      flash(
        !ok
          ? `已恢复到「${version.name}」，但存不进去：浏览器存储空间满了`
          : kept
            ? `已恢复到「${version.name}」，恢复前的内容也留了一份`
            : `已恢复到「${version.name}」，已自动保存`,
      )
    },
    [archiveSnapshot, flash],
  )

  const deleteVersionById = useCallback(
    (id: string) => {
      persistVersions(removeVersion(versions, id), '已删除该存档')
    },
    [versions, persistVersions],
  )

  const renameVersionById = useCallback(
    (id: string, name: string) => {
      const next = renameVersion(versions, id, name)
      if (next === versions) return
      persistVersions(next, `已改名为「${name.trim()}」`)
    },
    [versions, persistVersions],
  )

  /** 导出备份文件：换电脑时把它带走 */
  const exportBackup = useCallback(() => {
    if (!versions.length) return
    try {
      const blob = new Blob([backupPayload(versions)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const d = new Date()
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
        d.getDate(),
      ).padStart(2, '0')}`
      const a = document.createElement('a')
      a.href = url
      a.download = `简历版本备份-${stamp}.json`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      flash(`已导出 ${versions.length} 份存档`)
    } catch (e) {
      console.error('导出备份失败', e)
      flash('导出备份失败，在普通浏览器窗口里再试一次')
    }
  }, [versions, flash])

  /** 导入备份文件：按 id 合并，本地已有的不动 */
  const importBackup = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        const incoming = parseVersions(String(reader.result ?? ''))
        if (!incoming.length) {
          flash('这个文件里没有能识别的存档')
          return
        }
        const next = mergeVersions(versions, incoming)
        const added = next.length - versions.length
        persistVersions(next, added > 0 ? `已导入 ${added} 份存档` : '这些存档本地已经有了')
      }
      reader.onerror = () => flash('这个文件读不出来')
      reader.readAsText(file)
    },
    [versions, persistVersions, flash],
  )

  // 量纸面与内容高度：页数、页尺都从这里来
  const [contentH, setContentH] = useState(A4_HEIGHT_PX)

  useEffect(() => {
    const el = resumeRef.current
    if (!el) return
    const update = () => {
      const padB = parseFloat(getComputedStyle(el).paddingBottom) || 0
      const content = Math.max(0, el.scrollHeight - padB)
      setContentH(content)
      setPaperH(el.scrollHeight)
      setPages(pageFit(content).pages)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const downloadImage = useCallback(async () => {
    const el = resumeRef.current
    if (!el) return
    archiveBeforeExport()
    try {
      const url = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' })
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportFileName(data)}.png`
      a.click()
    } catch (e) {
      console.error('导出图片失败', e)
    }
  }, [data, archiveBeforeExport])

  const copyImage = useCallback(async () => {
    const el = resumeRef.current
    if (!el) return
    archiveBeforeExport()
    try {
      const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: '#ffffff' })
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch (e) {
      console.error('复制图片失败', e)
    }
  }, [archiveBeforeExport])

  const exportPdf = useCallback(() => {
    archiveBeforeExport()
    // 浏览器「另存为 PDF」会用 document.title 作为默认文件名，
    // 打印前临时改为 日期-姓名-岗位，结束后恢复
    const originalTitle = document.title
    document.title = exportFileName(data)
    let restored = false
    const restore = () => {
      if (restored) return
      restored = true
      document.title = originalTitle
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
    // 多数浏览器 print() 会阻塞到对话框关闭，这里兜底恢复（阻塞场景下在对话框关闭后才执行）
    window.setTimeout(restore, 1000)
  }, [data, archiveBeforeExport])

  return (
    <div className="h-screen flex flex-col bg-shell text-fg">
      <Header
        theme={theme}
        onThemeChange={changeTheme}
        shell={shell}
        onShellChange={changeShell}
        pages={pages}
        onDownloadImage={downloadImage}
        onCopyImage={copyImage}
        onExportPdf={exportPdf}
        onOpenVersions={() => setDrawerOpen(true)}
        versionCount={versions.length}
        layout={layout}
        layoutOpen={layoutOpen}
        onToggleLayout={() => setLayoutOpen((open) => !open)}
      />

      {/* 排版工具条：占文档流的一整行，把工作区往下推，不盖住纸面 */}
      {layoutOpen && (
        <LayoutPanel
          layout={layout}
          onChange={changeLayout}
          onClose={() => setLayoutOpen(false)}
        />
      )}

      <div className="flex-1 flex overflow-hidden w-full relative min-h-0">
        <EditorPanel
          data={data}
          width={panelW}
          onChange={patch}
          onSave={save}
          saved={saved}
          onNotice={flash}
        />

        {/* 拖拽分隔条 */}
        <div
          onMouseDown={startDrag}
          className="panel-divider group w-[7px] shrink-0 cursor-col-resize relative"
          title="拖拽调整面板宽度"
        >
          <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-edge group-hover:bg-gold transition-colors" />
        </div>

        {/* 预览区：纸面 + 左侧页尺 */}
        <main
          ref={mainRef}
          className="preview-panel workbench flex-1 h-full relative min-w-0 flex flex-col"
        >
          <div className="stage-center flex-1 overflow-auto flex justify-center items-start px-10 py-10">
            <div className="flex items-start gap-5">
              {scale >= 0.45 && (
                <Ruler scale={scale} paperH={paperH} contentH={contentH} pagePx={A4_HEIGHT_PX} />
              )}
              <div className="flex flex-col gap-2.5">
                <div
                  className="stage-frame relative"
                  style={{ width: PAPER_W * scale, height: paperH * scale }}
                >
                  <div
                    id="print-scaler"
                    className="select-none origin-top-left"
                    style={{
                      width: PAPER_W,
                      height: paperH,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <ResumePreview ref={resumeRef} data={data} theme={theme} layout={layout} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 校样状态栏：始终能看到纸面尺寸与内容占比 */}
          <div className="stage-caption shrink-0 h-[26px] px-4 flex items-center justify-between bg-shell border-t border-edge font-mono text-[9.5px] tracking-[0.08em] text-fg-3">
            <span>A4 · 210 × 297 MM</span>
            <span>
              {pages} 页 · 内容 {pageFit(contentH).fit.toFixed(2)}
            </span>
          </div>
        </main>
      </div>

      <VersionDrawer
        open={drawerOpen}
        versions={versions}
        current={data}
        onClose={() => setDrawerOpen(false)}
        onSaveNew={saveNewVersion}
        onRestore={restoreVersion}
        onDelete={deleteVersionById}
        onRename={renameVersionById}
        onExport={exportBackup}
        onImport={importBackup}
        defaultName={defaultVersionName(data)}
      />

      {/* 版本操作的即时反馈 */}
      {versionMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-shell border border-gold/60 font-mono text-[11px] tracking-[0.06em] text-fg shadow-lg">
          {versionMsg}
        </div>
      )}
    </div>
  )
}
