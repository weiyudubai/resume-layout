import {
  Archive,
  Copy,
  FileDown,
  ImageDown,
  Moon,
  SlidersHorizontal,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { THEMES, type ThemeId } from '../types'
import { SHELLS, type ShellId } from '../shell'
import { isDefaultLayout, type LayoutTune } from '../layout'

interface Props {
  theme: ThemeId
  onThemeChange: (t: ThemeId) => void
  shell: ShellId
  onShellChange: (s: ShellId) => void
  pages: number
  onDownloadImage: () => void
  onCopyImage: () => void
  onExportPdf: () => void
  onOpenVersions: () => void
  versionCount: number
  layout: LayoutTune
  layoutOpen: boolean
  onToggleLayout: () => void
}

/** 页签序号用罗马数字：像一份分章节的册子 */
const ROMAN = ['I', 'II', 'III', 'IV']

/** 外壳图标：暖米用太阳、深海军蓝用月亮，比「深 / 暖」两个字更直观 */
const SHELL_ICON = { light: Sun, dark: Moon } as const

/** 顶栏小图标统一规格：13px、细线，和正文同一套笔画粗细 */
function Glyph({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={13} strokeWidth={1.6} aria-hidden className="shrink-0" />
}

export default function Header({
  theme,
  onThemeChange,
  shell,
  onShellChange,
  pages,
  onDownloadImage,
  onCopyImage,
  onExportPdf,
  onOpenVersions,
  versionCount,
  layout,
  layoutOpen,
  onToggleLayout,
}: Props) {
  const layoutDefaulted = isDefaultLayout(layout)
  return (
    <header className="h-[58px] shrink-0 flex items-stretch gap-9 px-6 bg-shell border-b border-edge relative z-20">
      {/* 字标：古金方章 + 衬线字，像旧刊左上角的刊记 */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          aria-hidden
          className="w-7 h-7 bg-gold text-shell font-serif text-[15px] leading-7 text-center select-none"
        >
          稿
        </span>
        <div className="leading-none">
          <div className="font-serif text-[19px] tracking-[0.01em] text-fg">简历排版助手</div>
          <div className="font-mono text-[10px] tracking-[0.18em] text-fg-3 mt-1.5">
            MARKDOWN → A4
          </div>
        </div>
      </div>

      {/* 主题：罗马数字 + 文字页签，激活项用一条古金线压住分隔线 */}
      <nav className="flex items-stretch gap-7 ml-1">
        {THEMES.map((t, i) => {
          const active = theme === t.id
          return (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              aria-pressed={active}
              className={`font-mono text-[12px] tracking-[0.08em] border-b-2 -mb-px transition-colors ${
                active
                  ? 'text-gold border-gold'
                  : 'text-fg-3 border-transparent hover:text-fg-2'
              }`}
            >
              <span className="text-[9.5px] tracking-[0.14em] mr-2 opacity-75">
                {ROMAN[i] ?? t.id}
              </span>
              {t.label}
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
        {/* 排版微调开关：点开在顶栏下方展开一整行工具条，不遮挡纸面 */}
        <button
          onClick={onToggleLayout}
          aria-expanded={layoutOpen}
          title="排版微调：字号、行距、照片、页边距、字体"
          className={`btn ${layoutOpen || !layoutDefaulted ? 'text-gold border-gold/60' : ''}`}
        >
          <Glyph icon={SlidersHorizontal} />
          排版
          {!layoutDefaulted && (
            <span className="w-1.5 h-1.5 bg-gold rounded-full" aria-label="已调整" />
          )}
        </button>

        {/* 版本存档：按「岗位 × 公司」留多份，随时翻回来接着改 */}
        <button
          onClick={onOpenVersions}
          title="查看历史版本、导出备份"
          className={`btn ${versionCount ? 'text-gold border-gold/60' : ''}`}
        >
          <Glyph icon={Archive} />
          版本
          <span className="font-mono text-[11px] opacity-75">{versionCount}</span>
        </button>
        <button onClick={onDownloadImage} title="下载为图片" className="btn">
          <Glyph icon={ImageDown} />
          存图
        </button>
        <button onClick={onCopyImage} title="复制图片到剪贴板" className="btn">
          <Glyph icon={Copy} />
          复制
        </button>
        <button onClick={onExportPdf} title="导出 PDF（浏览器打印，可选「存储为 PDF」）" className="btn btn-solid">
          <Glyph icon={FileDown} />
          导出 PDF
          <span className="font-mono text-[11px] opacity-75">{pages} 页</span>
        </button>

        {/* 外壳切换：太阳 = 暖米，月亮 = 深海军蓝。纸面不受影响，始终白纸黑字 */}
        <div className="flex items-stretch border border-edge ml-3" title="切换外壳配色">
          {SHELLS.map((s) => {
            const active = shell === s.id
            const Icon = SHELL_ICON[s.id]
            return (
              <button
                key={s.id}
                onClick={() => onShellChange(s.id)}
                aria-pressed={active}
                aria-label={`外壳：${s.name}`}
                title={`外壳：${s.name}`}
                className={`w-9 h-9 flex items-center justify-center transition-colors border-l border-edge first:border-l-0 ${
                  active ? 'bg-gold/20 text-gold' : 'text-fg-3 hover:text-fg-2'
                }`}
              >
                <Icon size={15} strokeWidth={1.5} aria-hidden />
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
