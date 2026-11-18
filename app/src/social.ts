/** 社媒字段：公众号 / 小红书 / GitHub / 个人网站，空值不展示 */
export interface SocialData {
  /** 公众号名称 */
  wechat: string
  /** 小红书账号（纸面上显示的名字） */
  xiaohongshu: string
  /** 小红书主页链接，给「小红书」那条社媒接上可点地址 */
  xiaohongshuUrl: string
  /** GitHub 用户名或主页链接，展示时统一成 github.com/<用户名> */
  github: string
  /** 个人网站主页地址，纸面上去掉协议只显示域名 */
  website: string
}

export type SocialKind = 'wechat' | 'xiaohongshu' | 'github' | 'website'

export interface SocialEntry {
  kind: SocialKind
  /** 平台名：公众号 / 小红书 / GitHub */
  label: string
  /** 纸面上展示的文字（GitHub 是完整地址，给旧版模板用） */
  text: string
  /** 账号本体（GitHub 是用户名），紧凑版式用这个 */
  handle: string
  /** 可点击链接（GitHub / 小红书主页 / 个人网站有） */
  href?: string
}

/** 去掉用户顺手输入的 @ 和首尾空格；老数据里缺字段时按空值处理 */
function cleanHandle(v: string | undefined): string {
  if (!v) return ''
  return v.trim().replace(/^@+/, '').trim()
}

/**
 * 从 GitHub 输入里取出用户名，兼容三种写法：
 * example / github.com/example / https://github.com/example
 */
export function githubHandle(input: string): string {
  let v = cleanHandle(input)
  if (!v) return ''
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const matched = v.match(/^github\.com\/([^/?#]+)/i)
  if (matched) return matched[1]
  return v.split(/[/?#]/)[0]
}

/**
 * 个人网站：纸面上只显示域名，不拖着 https:// 和末尾斜杠。
 * https://example.com/ → example.com
 */
export function websiteDomain(input: string): string {
  let v = cleanHandle(input)
  if (!v) return ''
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  return v.replace(/\/+$/, '')
}

/** 个人网站的可点链接：没写协议就补 https://，空值不产生链接 */
export function websiteHref(input: string): string | undefined {
  const v = cleanHandle(input)
  if (!v) return undefined
  if (/^https?:\/\//i.test(v)) return v
  return `https://${websiteDomain(v)}`
}

/** 小红书主页的可点链接：补齐 https://，空值不产生链接 */
export function xiaohongshuHref(input: string | undefined): string | undefined {
  const v = cleanHandle(input)
  if (!v) return undefined
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

/** 互联网风字段表用的短标签 */
export function socialAbbr(kind: SocialKind): string {
  switch (kind) {
    case 'wechat':
      return 'WX'
    case 'xiaohongshu':
      return 'RED'
    case 'github':
      return 'GH'
    case 'website':
      return 'WEB'
  }
}

/** 把数据里的社媒字段整理成纸面要展示的条目，空值直接跳过 */
export function socialEntries(data: SocialData): SocialEntry[] {
  const entries: SocialEntry[] = []

  const wechat = cleanHandle(data.wechat)
  if (wechat) entries.push({ kind: 'wechat', label: '公众号', text: wechat, handle: wechat })

  const xiaohongshu = cleanHandle(data.xiaohongshu)
  if (xiaohongshu)
    entries.push({
      kind: 'xiaohongshu',
      label: '小红书',
      text: xiaohongshu,
      handle: xiaohongshu,
      href: xiaohongshuHref(data.xiaohongshuUrl),
    })

  const github = githubHandle(data.github)
  if (github) {
    entries.push({
      kind: 'github',
      label: 'GitHub',
      text: `github.com/${github}`,
      handle: github,
      href: `https://github.com/${github}`,
    })
  }

  const website = websiteDomain(data.website)
  if (website) {
    entries.push({
      kind: 'website',
      label: '个人网站',
      text: website,
      handle: website,
      href: websiteHref(data.website),
    })
  }

  return entries
}
