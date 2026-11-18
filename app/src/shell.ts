/**
 * 外壳 = 工具界面本身的配色（顶栏、编辑栏、工作台）。
 * 与「简历纸面主题」是两回事：外壳两档可切换，纸面四套可切换，二者自由组合。
 * 实际颜色由 index.css 里的 CSS 变量决定，切换时只改 <html data-shell>。
 */
export type ShellId = 'dark' | 'light'

export interface ShellDef {
  id: ShellId
  /** 切换器上的两个字 */
  label: string
  /** 全称，鼠标悬停提示用 */
  name: string
}

export const SHELLS: ShellDef[] = [
  { id: 'dark', label: '深', name: '深海军蓝' },
  { id: 'light', label: '暖', name: '暖米' },
]

export const DEFAULT_SHELL: ShellId = 'dark'

export function isShellId(v: unknown): v is ShellId {
  return v === 'dark' || v === 'light'
}
