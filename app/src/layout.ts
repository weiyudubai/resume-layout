/**
 * 排版微调：字号 / 行距 / 字体 / 照片比例 / 页边距。
 *
 * 五个值都是「相对现状的倍数」，默认 1（字体是 'default'）——
 * 也就是用户什么都不调时，四套主题保持现在的样子，尤其商务正式一动不动。
 * 具体实现见 themes.ts（字号/行距写成 calc(Npx * var(--fs))、
 * 页边距写成 calc(Npx * var(--pad))）、ResumePreview.tsx
 * （照片尺寸 calc(base * var(--photo))）与 index.css（字体覆盖）。
 *
 * 本文件只放纯函数，不碰 DOM，方便 check_layout.mjs 直接 import 做单测。
 */

export const LAYOUT_KEY = 'resume-assistant-layout'

export type FontId = 'default' | 'heiti' | 'songti' | 'kaiti'

export interface LayoutTune {
  /** 字号倍率，1 = 现状 */
  fontScale: number
  /** 行距倍率，1 = 现状 */
  lineScale: number
  /** 字体组合 */
  font: FontId
  /** 照片尺寸倍率，1 = 现状 */
  photoScale: number
  /** 页边距倍率，1 = 现状；调小可把内容往里收、凑进一页 */
  marginScale: number
}

export const DEFAULT_LAYOUT: LayoutTune = {
  fontScale: 1,
  lineScale: 1,
  font: 'default',
  photoScale: 1,
  marginScale: 1,
}

/** 字体组合都用电脑自带字体，零下载、离线可用 */
export const FONT_PRESETS: { id: FontId; label: string; css: string }[] = [
  { id: 'default', label: '主题默认', css: '' },
  {
    id: 'heiti',
    label: '现代黑体',
    css: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Heiti SC', sans-serif",
  },
  {
    id: 'songti',
    label: '经典宋体',
    css: "'Songti SC', 'STSong', 'Noto Serif CJK SC', 'SimSun', serif",
  },
  {
    id: 'kaiti',
    label: '人文楷体',
    css: "'Kaiti SC', 'STKaiti', 'KaiTi', '楷体', serif",
  },
]

export const FONT_SCALE_STEPS = [0.9, 0.95, 1, 1.05, 1.1, 1.15]
export const LINE_SCALE_STEPS = [0.9, 1, 1.1, 1.2]
// 照片放宽到 200%：一寸/两寸照放大后仍是清晰位图，打印不糊
export const PHOTO_SCALE_STEPS = [0.8, 0.9, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2]
// 页边距：往小调到 70% 能把内容往里收，配合字号/行距把简历凑进一页
export const MARGIN_SCALE_STEPS = [0.7, 0.8, 0.9, 1, 1.1, 1.2]

export function isFontId(v: unknown): v is FontId {
  return FONT_PRESETS.some((p) => p.id === v)
}

/** 找到最接近 value 的档位下标（读老数据/手改数据时用） */
function nearestIndex(value: number, steps: readonly number[]): number {
  let best = 0
  let bestGap = Infinity
  for (let i = 0; i < steps.length; i++) {
    const gap = Math.abs(steps[i] - value)
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  }
  return best
}

/** 把任意输入收敛成一份合法配置：坏值一律回退默认值 */
export function clampLayout(raw: unknown): LayoutTune {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const pick = (v: unknown, steps: readonly number[]) =>
    typeof v === 'number' && Number.isFinite(v) ? steps[nearestIndex(v, steps)] : 1
  return {
    fontScale: pick(obj.fontScale, FONT_SCALE_STEPS),
    lineScale: pick(obj.lineScale, LINE_SCALE_STEPS),
    font: isFontId(obj.font) ? obj.font : 'default',
    photoScale: pick(obj.photoScale, PHOTO_SCALE_STEPS),
    marginScale: pick(obj.marginScale, MARGIN_SCALE_STEPS),
  }
}

/** localStorage 里读出来的字符串 -> 配置 */
export function parseLayout(raw: string | null): LayoutTune {
  if (!raw) return DEFAULT_LAYOUT
  try {
    return clampLayout(JSON.parse(raw))
  } catch {
    return DEFAULT_LAYOUT
  }
}

/** 按 +/- 在当前档位上走一步，走到头就停住 */
export function stepScale(value: number, steps: readonly number[], dir: 1 | -1): number {
  const i = nearestIndex(value, steps)
  return steps[Math.min(steps.length - 1, Math.max(0, i + dir))]
}

/** 是否完全等于默认（面板据此显示「已恢复默认」） */
export function isDefaultLayout(l: LayoutTune): boolean {
  return (
    l.fontScale === 1 &&
    l.lineScale === 1 &&
    l.font === 'default' &&
    l.photoScale === 1 &&
    l.marginScale === 1
  )
}

/** 给界面显示的百分比，如 1.05 -> "105%" */
export function scaleLabel(scale: number): string {
  return `${Math.round(scale * 100)}%`
}

/** 当前字体的 CSS font-family；'default' 返回空串表示沿用各主题自带字体 */
export function fontCss(id: FontId): string {
  return FONT_PRESETS.find((p) => p.id === id)?.css ?? ''
}
