import { useEffect } from 'react'
import { RotateCcw, Minus, Plus, Check, X } from 'lucide-react'
import {
  DEFAULT_LAYOUT,
  FONT_PRESETS,
  FONT_SCALE_STEPS,
  LINE_SCALE_STEPS,
  MARGIN_SCALE_STEPS,
  PHOTO_SCALE_STEPS,
  isDefaultLayout,
  scaleLabel,
  stepScale,
  type LayoutTune,
} from '../layout'

interface Props {
  layout: LayoutTune
  onChange: (next: LayoutTune) => void
  onClose: () => void
}

/**
 * 排版微调：顶栏「排版」按钮点开后，在顶栏正下方展开一整行工具条。
 * 它占据文档流（不是浮层），把工作区往下推，不会盖住简历纸面。
 * 五个值全部以「相对现状的倍数」表达，默认 1 / 主题默认 = 现在的样子。
 */
export default function LayoutPanel({ layout, onChange, onClose }: Props) {
  const defaulted = isDefaultLayout(layout)
  const set = (p: Partial<LayoutTune>) => onChange({ ...layout, ...p })

  // Esc 收起
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  /** 一行微调：小标题 + − / 当前值 / +，小标题点一下等于复位 */
  function Stepper({
    label,
    hint,
    value,
    steps,
    onSet,
  }: {
    label: string
    hint: string
    value: number
    steps: readonly number[]
    onSet: (value: number) => void
  }) {
    const atDefault = value === 1
    return (
      <div className="flex items-center gap-1 shrink-0" title={`${label}：${hint}`}>
        <button
          onClick={() => onSet(1)}
          disabled={atDefault}
          title={`${label}恢复默认 100%`}
          className="font-mono text-[10.5px] tracking-[0.08em] text-fg-2 hover:text-gold disabled:opacity-60 disabled:hover:text-fg-2 w-9 whitespace-nowrap text-left"
        >
          {label}
        </button>
        <button
          onClick={() => onSet(stepScale(value, steps, -1))}
          disabled={value === steps[0]}
          aria-label={`${label}减小`}
          className="w-6 h-6 flex items-center justify-center border border-edge text-fg-2 hover:text-gold hover:border-gold disabled:opacity-30 disabled:hover:text-fg-2 disabled:hover:border-edge"
        >
          <Minus size={12} strokeWidth={1.7} aria-hidden />
        </button>
        <span className="w-10 text-center font-mono text-[11px] tracking-[0.04em] text-fg tabular-nums">
          {scaleLabel(value)}
        </span>
        <button
          onClick={() => onSet(stepScale(value, steps, 1))}
          disabled={value === steps[steps.length - 1]}
          aria-label={`${label}增大`}
          className="w-6 h-6 flex items-center justify-center border border-edge text-fg-2 hover:text-gold hover:border-gold disabled:opacity-30 disabled:hover:text-fg-2 disabled:hover:border-edge"
        >
          <Plus size={12} strokeWidth={1.7} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="排版微调"
      className="layout-toolbar shrink-0 min-h-[52px] w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2 bg-shell-alt border-b border-edge"
    >
      <span className="hidden xl:inline font-mono text-[10px] tracking-[0.14em] text-fg-3 shrink-0">排版微调</span>
      <span className="hidden xl:block w-px h-5 bg-edge shrink-0" aria-hidden />

      <Stepper
        label="字号"
        hint="整份简历的字号，默认 100%"
        value={layout.fontScale}
        steps={FONT_SCALE_STEPS}
        onSet={(v) => set({ fontScale: v })}
      />
      <Stepper
        label="行距"
        hint="正文行间距，调小可多放内容"
        value={layout.lineScale}
        steps={LINE_SCALE_STEPS}
        onSet={(v) => set({ lineScale: v })}
      />
      <Stepper
        label="照片"
        hint="照片尺寸，80%–200%"
        value={layout.photoScale}
        steps={PHOTO_SCALE_STEPS}
        onSet={(v) => set({ photoScale: v })}
      />
      <Stepper
        label="页边距"
        hint="纸面四周留白，调小可把内容往里收、更容易排进一页"
        value={layout.marginScale}
        steps={MARGIN_SCALE_STEPS}
        onSet={(v) => set({ marginScale: v })}
      />

      <span className="w-px h-5 bg-edge shrink-0" aria-hidden />

      {/* 字体：一行四个小按钮，默认不覆盖、其余用电脑自带字体 */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-fg-2 w-8 whitespace-nowrap">字体</span>
        {FONT_PRESETS.map((f) => {
          const active = layout.font === f.id
          return (
            <button
              key={f.id}
              onClick={() => set({ font: f.id })}
              aria-pressed={active}
              title={`${f.label}${f.id === 'default' ? '：沿用各主题自带字体' : '：用电脑自带字体，无需联网'}`}
              className={`h-6 px-1.5 flex items-center justify-center gap-1 border text-[10.5px] transition-colors ${
                active
                  ? 'border-gold bg-gold/15 text-gold'
                  : 'border-edge text-fg-2 hover:text-fg hover:border-fg-3'
              }`}
            >
              {active && <Check size={10} strokeWidth={2} aria-hidden />}
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={() => onChange(DEFAULT_LAYOUT)}
        disabled={defaulted}
        className="font-mono text-[10px] tracking-[0.06em] text-fg-3 hover:text-gold disabled:opacity-30 disabled:hover:text-fg-3 inline-flex items-center gap-1 shrink-0"
      >
        <RotateCcw size={11} strokeWidth={1.6} aria-hidden />
        全部复位
      </button>
      <button
        onClick={onClose}
        aria-label="收起排版微调"
        title="收起排版微调（Esc）"
        className="w-7 h-7 flex items-center justify-center border border-edge text-fg-2 hover:text-gold hover:border-gold shrink-0"
      >
        <X size={13} strokeWidth={1.7} aria-hidden />
      </button>
    </div>
  )
}
