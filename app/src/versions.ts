/**
 * 简历版本存档：把当前这份简历整体存成一个带名字的快照，随时翻回来接着改。
 *
 * 数据落在 localStorage（约 5MB，跟着「这台电脑的这个浏览器」走，不跟 HTML 文件走），
 * 所以必须配 导出备份 / 导入备份 兜底，换电脑时把它带过去。
 *
 * 注意：本文件要能被 `node scripts/check_versions.mjs` 直接 import 做单测，
 * 因此跨模块的运行时导入写全 `.ts` 后缀（Node 的 ESM 解析不猜扩展名）。
 */
import { DEFAULT_DATA, THEMES } from './types.ts'
import type { ResumeData, ThemeId } from './types.ts'

export interface ResumeVersion {
  id: string
  /** 用户可改的名字，默认「意向岗位 · 8月12日」 */
  name: string
  /** 存档时间（epoch ms） */
  savedAt: number
  theme: ThemeId
  data: ResumeData
}

/** 版本列表的持久化键 */
export const VERSIONS_KEY = 'resume-assistant-versions'
/** 备份文件里的标识，导入时用来认「这是本工具导出的备份」 */
export const BACKUP_KIND = 'resume-assistant-versions'
/** 备份文件格式版本，将来改结构时用来兼容老文件 */
export const BACKUP_FORMAT = 1
/** 版本区可用体积预算；localStorage 约 5MB，留出余量给当前工作副本 */
export const VERSIONS_BUDGET = 4 * 1024 * 1024
/** 存档里主题缺失或不认识时的回退值（与 App 的 loadTheme 一致） */
const FALLBACK_THEME: ThemeId = 'tech'

/** 唯一但不依赖 crypto 的 id：时间戳 + 随机尾巴 */
export function newVersionId(now = Date.now(), rand = Math.random()): string {
  return `v${now.toString(36)}-${Math.floor(rand * 1e6).toString(36)}`
}

/** 默认版本名：「高级前端工程师 · 8月12日」，没填岗位就用姓名，都没有就叫未命名 */
/** 存档名里的日期尾巴：11月17日 */
export function dateStamp(now = new Date()): string {
  return `${now.getMonth() + 1}月${now.getDate()}日`
}

export function defaultVersionName(data: ResumeData, now = new Date()): string {
  const label = data.jobTitle.trim() || data.name.trim() || '未命名'
  return `${label} · ${dateStamp(now)}`
}

/** 正文有效字数（去掉空白，和左栏字数统计同一套算法） */
export function markdownCharCount(markdown: string): number {
  return markdown.replace(/\s/g, '').length
}

/** 内容指纹：字段名排序后拼串，用来判断两份简历是否完全一致 */
export function resumeFingerprint(data: ResumeData): string {
  const rec = data as unknown as Record<string, unknown>
  return Object.keys(rec)
    .sort()
    .map((k) => `${k}=${JSON.stringify(rec[k] ?? null)}`)
    .join('|')
}

/** 找出和当前内容完全一致的那份存档，没有就返回 undefined */
export function findSameVersion(
  versions: ResumeVersion[],
  data: ResumeData,
): ResumeVersion | undefined {
  const fp = resumeFingerprint(data)
  return versions.find((v) => resumeFingerprint(v.data) === fp)
}

export function sortVersions(list: ResumeVersion[]): ResumeVersion[] {
  return [...list].sort((a, b) => b.savedAt - a.savedAt)
}

/** 同 id 视为同一条（重新存档会覆盖），其余按时间倒序 */
export function upsertVersion(list: ResumeVersion[], version: ResumeVersion): ResumeVersion[] {
  return sortVersions([version, ...list.filter((v) => v.id !== version.id)])
}

export function removeVersion(list: ResumeVersion[], id: string): ResumeVersion[] {
  return list.filter((v) => v.id !== id)
}

/** 改名字；空名字视为取消，原名字不动 */
export function renameVersion(list: ResumeVersion[], id: string, name: string): ResumeVersion[] {
  const clean = name.trim()
  if (!clean) return list
  return list.map((v) => (v.id === id ? { ...v, name: clean } : v))
}

/** 导入备份：按 id 合并，已存在的同 id 以本地为准（不覆盖用户手里的数据） */
export function mergeVersions(current: ResumeVersion[], incoming: ResumeVersion[]): ResumeVersion[] {
  const byId = new Map(current.map((v) => [v.id, v]))
  for (const v of incoming) {
    if (!byId.has(v.id)) byId.set(v.id, v)
  }
  return sortVersions([...byId.values()])
}

function isThemeId(v: unknown): v is ThemeId {
  return typeof v === 'string' && THEMES.some((t) => t.id === v)
}

/** 把一条来路不明的记录收敛成合法存档；认不出来就丢掉（返回 null） */
function toVersion(raw: unknown): ResumeVersion | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id) return null
  if (typeof r.savedAt !== 'number' || !Number.isFinite(r.savedAt)) return null
  if (!r.data || typeof r.data !== 'object' || Array.isArray(r.data)) return null
  const rawName = typeof r.name === 'string' ? r.name.trim() : ''
  return {
    id: r.id,
    name: rawName || '未命名',
    savedAt: r.savedAt,
    theme: isThemeId(r.theme) ? r.theme : FALLBACK_THEME,
    // 老存档可能缺字段：和默认数据合并，避免恢复后输入框出现 undefined
    data: { ...DEFAULT_DATA, ...(r.data as Partial<ResumeData>) } as ResumeData,
  }
}

/**
 * 解析本地的版本列表，也接受导出的备份文件内容。
 * 坏数据一律跳过，绝不让一条脏记录把整个列表带崩。
 */
export function parseVersions(raw: string | null): ResumeVersion[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { versions?: unknown }).versions)
      ? ((parsed as { versions: unknown[] }).versions)
      : []
  const seen = new Set<string>()
  const out: ResumeVersion[] = []
  for (const item of list) {
    const v = toVersion(item)
    if (v && !seen.has(v.id)) {
      seen.add(v.id)
      out.push(v)
    }
  }
  return sortVersions(out)
}

/** 导出用的备份内容（带标识与格式号，导入时好认） */
export function backupPayload(versions: ResumeVersion[], now = Date.now()): string {
  return JSON.stringify(
    { kind: BACKUP_KIND, format: BACKUP_FORMAT, exportedAt: now, versions },
    null,
    2,
  )
}

/** 字符串按 UTF-8 计的字节数（localStorage 配额按这个量） */
export function jsonBytes(s: string): number {
  try {
    return new Blob([s]).size
  } catch {
    return s.length * 2
  }
}

export function versionsBytes(list: ResumeVersion[]): number {
  return jsonBytes(JSON.stringify(list))
}

/** 人类可读的体积，例如 12.4 KB / 1.8 MB */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** 存档时间：刚刚 / 12 分钟前 / 今天 14:32 / 8月12日 09:05 */
export function formatVersionTime(ts: number, now = Date.now()): string {
  if (!Number.isFinite(ts)) return ''
  const diff = now - ts
  if (diff < 0) return ''
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const sameDay = new Date(now).toDateString() === d.toDateString()
  return sameDay ? `今天 ${hh}:${mm}` : `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
}
