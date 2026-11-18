/** 一页 A4 在 96dpi 下的像素高度 */
export const A4_HEIGHT_PX = 1123

export interface PageFit {
  /** 打印页数，至少 1 */
  pages: number
  /** 内容占几页（可为小数） */
  fit: number
  /** 是否超过一页 */
  overflow: boolean
}

/**
 * 把内容高度换算成页数与占比。
 * 只看高度，真实分页仍由浏览器打印引擎决定。
 */
export function pageFit(contentPx: number, pagePx: number = A4_HEIGHT_PX): PageFit {
  const safe = Number.isFinite(contentPx) ? Math.max(0, contentPx) : 0
  const page = pagePx > 0 ? pagePx : A4_HEIGHT_PX
  const fit = safe / page
  return {
    pages: Math.max(1, Math.ceil(fit)),
    fit,
    // 1px 容差：纸面自身高度取整后可能比内容多一两像素
    overflow: safe > page + 1,
  }
}
