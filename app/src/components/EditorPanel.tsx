import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import type { ResumeData } from '../types'
import { WeChatIcon, XiaohongshuIcon, GithubIcon, WebsiteIcon, PhoneIcon, MailIcon } from './BrandIcons'
import { loadJSON, saveJSON } from '../storage'
import {
  MIN_EDITOR_H,
  SPLIT_KEY,
  clampInfoHeight,
  defaultInfoHeight,
  parseInfoHeight,
} from '../split'
import { dataUrlBytes, preparePhoto } from '../photo'

interface Props {
  data: ResumeData
  width: number
  onChange: (p: Partial<ResumeData>) => void
  onSave: () => void
  saved: boolean
  /** 冒个泡提示一句（照片压缩结果等），复用顶栏那个 toast */
  onNotice?: (msg: string) => void
}

/** 一行下划线输入：标签在上，值在下，像信笺上的栏目 */
function Field({
  label,
  value,
  placeholder,
  title,
  onChange,
}: {
  label: ReactNode
  value: string
  placeholder?: string
  title?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="min-w-0">
      <label className="field-label flex items-center gap-1.5">{label}</label>
      <input
        className="line-input"
        value={value}
        placeholder={placeholder}
        title={title}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** 小节标题：栏目名 + 一条延伸到右边的细线，像信笺上的分栏 */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="font-mono text-[11px] tracking-[0.16em] text-gold whitespace-nowrap leading-none">
        {children}
      </span>
      <span className="flex-1 h-px bg-edge" />
    </div>
  )
}

export default function EditorPanel({
  data,
  width,
  onChange,
  onSave,
  saved,
  onNotice,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const infoRef = useRef<HTMLElement>(null)
  /** null = 还没拖过，按左栏高度的 42% 走 */
  const [infoH, setInfoH] = useState<number | null>(() => parseInfoHeight(loadJSON(SPLIT_KEY)))
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)
  const wordCount = data.markdown.replace(/\s/g, '').length

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      // 存原图会把浏览器的存储配额一次吃光（手机照片 3–5 MB，转 base64 还要更大）
      const compressed = await preparePhoto(file)
      onChange({ photo: compressed })
      onNotice?.(`照片已压到 ${Math.round(dataUrlBytes(compressed) / 1024)} KB`)
    } catch {
      onNotice?.('这张图读不出来，换一张试试')
    }
  }

  const asideHeight = () => asideRef.current?.getBoundingClientRect().height ?? 0

  const onDividerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const startH = infoRef.current?.getBoundingClientRect().height ?? infoH ?? 0
    dragRef.current = { startY: e.clientY, startH }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onDividerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    setInfoH(clampInfoHeight(drag.startH + (e.clientY - drag.startY), asideHeight()))
  }

  const onDividerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    // 拖动结束再落盘，避免每一帧都写 localStorage
    setInfoH((cur) => {
      if (cur !== null) saveJSON(SPLIT_KEY, String(cur))
      return cur
    })
  }

  /** 双击复位：回到默认比例 */
  const resetSplit = useCallback(() => {
    setInfoH(null)
    saveJSON(SPLIT_KEY, '')
  }, [])

  /** 键盘也能调，方向键一次 12px */
  const onDividerKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const cur = infoRef.current?.getBoundingClientRect().height ?? defaultInfoHeight(asideHeight())
    const step = e.key === 'ArrowUp' ? -12 : 12
    const next = clampInfoHeight(cur + step, asideHeight())
    setInfoH(next)
    saveJSON(SPLIT_KEY, String(next))
  }

  return (
    <aside
      ref={asideRef}
      className="shrink-0 h-full flex flex-col bg-shell border-r border-edge min-h-0"
      style={{ width }}
    >
      {/* 基本信息：高度可拖，内容多时自己滚动，不把 Markdown 编辑区挤没 */}
      <section
        ref={infoRef}
        className="px-5 pt-4 pb-4 shrink-0 overflow-y-auto"
        style={{
          height: infoH === null ? '42%' : infoH,
          // 窗口变矮时也不许吃掉下方编辑区
          maxHeight: `calc(100% - ${MIN_EDITOR_H}px)`,
        }}
      >
        <div className="mb-3">
          <SectionLabel>基本信息</SectionLabel>
        </div>

        {/* 照片 + 姓名 / 意向岗位：照片拉满整行高度，与右侧两条细线对齐 */}
        <div className="flex gap-3.5 items-stretch">
          <div className="shrink-0 w-[66px]">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
            {data.photo ? (
              <div className="relative group/photo h-full">
                <img
                  src={data.photo}
                  alt="照片"
                  className="w-full h-full object-cover border border-edge"
                />
                <button
                  onClick={() => onChange({ photo: null })}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gold text-shell items-center justify-center hidden group-hover/photo:flex"
                  title="移除照片"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-full min-h-[74px] border border-edge bg-shell-alt flex flex-col items-center justify-center gap-1 text-fg-2 hover:border-gold hover:text-gold transition-colors"
                title="上传照片"
              >
                <span className="text-[15px] font-light leading-none">＋</span>
                <span className="font-mono text-[9.5px] tracking-[0.1em]">照片</span>
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <Field label="姓名" value={data.name} onChange={(v) => onChange({ name: v })} />
            <Field
              label="意向岗位"
              value={data.jobTitle}
              onChange={(v) => onChange({ jobTitle: v })}
            />
          </div>
        </div>

        {/* 电话 / 邮箱：并排两列，邮箱分得更宽，长邮箱不会被裁掉 */}
        <div className="mt-2.5 grid grid-cols-[5fr_8fr] gap-x-3">
          <Field
            label={
              <>
                <PhoneIcon className="w-[11px] h-[11px] text-fg-2" />
                电话
              </>
            }
            value={data.phone}
            onChange={(v) => onChange({ phone: v })}
          />
          <Field
            label={
              <>
                <MailIcon className="w-[11px] h-[11px] text-fg-2" />
                邮箱
              </>
            }
            value={data.email}
            onChange={(v) => onChange({ email: v })}
          />
        </div>

        {/* 社媒 */}
        <div className="mt-2.5 grid grid-cols-3 gap-x-3">
          <Field
            label={
              <>
                <WeChatIcon className="w-[11px] h-[10px] text-[#07C160]" />
                公众号
              </>
            }
            value={data.wechat}
            placeholder="示例公众号"
            onChange={(v) => onChange({ wechat: v })}
          />
          <Field
            label={
              <>
                <XiaohongshuIcon className="w-[10px] h-[10px]" />
                小红书
              </>
            }
            value={data.xiaohongshu}
            placeholder="示例小红书"
            onChange={(v) => onChange({ xiaohongshu: v })}
          />
          <Field
            label={
              <>
                <GithubIcon className="w-[11px] h-[11px] text-fg-2" />
                GitHub
              </>
            }
            value={data.github}
            placeholder="用户名"
            onChange={(v) => onChange({ github: v })}
          />
        </div>

        {/* 主页链接：网址较长，两个并排一行，纸面上小红书仍显示账号名 */}
        <div className="mt-2.5 grid grid-cols-2 gap-x-3">
          <Field
            label={
              <>
                <WebsiteIcon className="w-[11px] h-[11px] text-fg-2" />
                个人网站
              </>
            }
            value={data.website}
            placeholder="https://example.com"
            title={data.website || undefined}
            onChange={(v) => onChange({ website: v })}
          />
          <Field
            label={
              <>
                <XiaohongshuIcon className="w-[10px] h-[10px]" />
                小红书主页
              </>
            }
            value={data.xiaohongshuUrl}
            placeholder="https://www.xiaohongshu.com/user/profile/..."
            title={data.xiaohongshuUrl || undefined}
            onChange={(v) => onChange({ xiaohongshuUrl: v })}
          />
        </div>

        {/* 一句话定位 */}
        <div className="mt-2.5">
          <Field
            label="一句话定位"
            value={data.tagline}
            placeholder="用一句话概括职业定位，例如：5年全栈经验，专注性能优化"
            onChange={(v) => onChange({ tagline: v })}
          />
        </div>
      </section>

      {/* 上下分栏把手：拖动改基本信息区高度，双击复位 */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="调整基本信息区高度"
        tabIndex={0}
        title="按住上下拖动，调整基本信息区高度；双击复位"
        onPointerDown={onDividerDown}
        onPointerMove={onDividerMove}
        onPointerUp={onDividerUp}
        onPointerCancel={onDividerUp}
        onDoubleClick={resetSplit}
        onKeyDown={onDividerKey}
        className="group/divider shrink-0 h-[7px] cursor-row-resize flex items-center touch-none focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold"
      >
        <span className="w-full h-px bg-edge group-hover/divider:bg-gold group-focus-visible/divider:bg-gold transition-colors" />
      </div>

      {/* 经历与详情 */}
      <div className="px-5 pt-3.5 pb-2.5 border-b border-edge shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <SectionLabel>经历与详情</SectionLabel>
          </div>
          <button
            onClick={onSave}
            className="font-mono text-[11px] tracking-[0.08em] text-gold underline decoration-gold underline-offset-[3px] hover:text-fg hover:decoration-fg transition-colors"
          >
            {saved ? '已保存' : '保存'}
          </button>
        </div>
        <div className="mt-1.5 font-mono text-[10.5px] text-fg-3">
          <b className="font-medium text-fg">{wordCount}</b> 字
        </div>
      </div>

      {/* Markdown 编辑区：占据左栏剩余全部空间 */}
      <textarea
        className="flex-1 min-h-[160px] w-full px-5 py-4 bg-shell-deep text-[12.5px] leading-[2.05] font-mono text-fg-2 resize-none border border-edge focus:outline-none focus:border-gold"
        value={data.markdown}
        onChange={(e) => onChange({ markdown: e.target.value })}
        spellCheck={false}
      />
    </aside>
  )
}
