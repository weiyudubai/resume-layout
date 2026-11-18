/**
 * 导出文件名：导出当天的日期 + 姓名 + 岗位，形如 2026.11.18-张三-高级前端工程师。
 * 存图 PNG 直接用它；导出 PDF 走浏览器打印，靠临时改 document.title 让它当默认名。
 * 抽成纯函数（传入 now，便于测试固定日期），不碰 DOM，Node 可直接 import 校验。
 */
export function exportFileName(
  data: { name: string; jobTitle: string },
  now: Date = new Date(),
): string {
  // 日期内部用点分隔，和姓名/岗位之间用短横线，正好是用户要的 2026.11.18-张三-高级前端工程师
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const stamp = `${y}.${m}.${d}`

  // 文件名非法字符和空白都去掉，免得 Windows / 某些网盘存不下来
  const clean = (s: string) => s.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '').trim()
  const parts = [clean(data.name), clean(data.jobTitle)].filter(Boolean)

  return parts.length ? [stamp, ...parts].join('-') : `${stamp}-简历`
}
