/**
 * 左栏上下分栏：基本信息区与 Markdown 编辑区的高度分配。
 * 纯函数，方便 Node 直接 import 做校验（见 app/scripts/check_split.mjs）。
 */

export const SPLIT_KEY = 'resume-assistant-split'

/** 基本信息区最小高度：照片 + 一行字段还看得见 */
export const MIN_INFO_H = 132

/** 下方「经历与详情 + Markdown」至少要留的高度 */
export const MIN_EDITOR_H = 220

/**
 * 把拖动后的高度夹进合法区间。
 * @param next 拖动得到的候选高度（px）
 * @param asideH 左栏当前总高度（px）
 */
export function clampInfoHeight(next: number, asideH: number): number {
  if (!Number.isFinite(next) || !Number.isFinite(asideH) || asideH <= 0) return MIN_INFO_H
  const max = asideH - MIN_EDITOR_H
  // 窗口太矮时上下两个下限打架，优先保住上方看得见字段
  if (max <= MIN_INFO_H) return MIN_INFO_H
  return Math.round(Math.min(Math.max(next, MIN_INFO_H), max))
}

/** 读回记住的高度；认不出来就返回 null（回到默认比例） */
export function parseInfoHeight(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : null
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null
  }
  return null
}

/** 默认高度：没拖过时按左栏高度的 42% */
export function defaultInfoHeight(asideH: number): number {
  if (!Number.isFinite(asideH) || asideH <= 0) return MIN_INFO_H
  return clampInfoHeight(asideH * 0.42, asideH)
}
