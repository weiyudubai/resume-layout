/**
 * 章节序号：学术经典模板的分节用中文序号（一、二、三……）。
 * 序号由渲染器生成，不写进用户内容——换主题、删章节都不用改 Markdown。
 */

const DIGITS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 1 → 一，10 → 十，11 → 十一，20 → 二十；超过 99 用阿拉伯数字兜底 */
export function chineseNumeral(n: number): string {
  if (!Number.isFinite(n) || n < 1) return String(n)
  const i = Math.floor(n)
  if (i > 99) return String(i)
  if (i < 10) return DIGITS[i - 1]
  const tens = Math.floor(i / 10)
  const ones = i % 10
  return `${tens === 1 ? '' : DIGITS[tens - 1]}十${ones === 0 ? '' : DIGITS[ones - 1]}`
}
