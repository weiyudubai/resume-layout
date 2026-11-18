#!/usr/bin/env node
/**
 * 品牌与顶栏校验：页签图标（SVG + PNG 兜底）是否与图形定义一致、按钮图标是否到位、
 * 外壳切换器是否改成了日月。
 * 跑法：cd app && npm test
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const read = (p) => readFileSync(new URL(p, root), 'utf8')

const html = read('index.html')
const header = read('src/components/Header.tsx')
const brandIcons = read('src/components/BrandIcons.tsx')
const editorPanel = read('src/components/EditorPanel.tsx')
const preview = read('src/components/ResumePreview.tsx')

let passed = 0
const check = (name, fn) => {
  try {
    fn()
    passed += 1
    console.log(`  ✓ ${name}`)
  } catch (e) {
    console.error(`  ✗ ${name}`)
    throw e
  }
}

/** 两种格式都要：SVG 给认它的浏览器，PNG 给 Safari 26 之前 */
function iconHrefs() {
  const svg = html.match(/rel="icon"\s+type="image\/svg\+xml"\s+href="([^"]+)"/)
  const png = html.match(/rel="icon"\s+type="image\/png"\s+sizes="32x32"\s+href="([^"]+)"/)
  assert.ok(svg, 'index.html 缺 SVG 页签图标')
  assert.ok(png, 'index.html 缺 PNG 兜底图标（Safari 26 之前不认 SVG）')
  return { svg: svg[1], png: png[1] }
}

check('页面同时声明了 SVG 与 PNG 两种页签图标', () => {
  iconHrefs()
})

/** 单文件离线：图标必须内联，不能是相对路径的文件引用 */
check('图标是内联 data URI，不是外部文件', () => {
  assert.ok(!/rel="icon"[^>]*href="(?!data:)/.test(html), '图标改成了外部文件，file:// 打开时会裂掉')
})

check('两个图标都能被解析成对应格式', () => {
  const { svg, png } = iconHrefs()
  const source = decodeURIComponent(svg.slice('data:image/svg+xml,'.length))
  assert.ok(source.startsWith('<svg '), `SVG 解出来不对：${source.slice(0, 40)}`)
  assert.ok(source.trimEnd().endsWith('</svg>'))
  const bytes = Buffer.from(png.slice('data:image/png;base64,'.length), 'base64')
  assert.equal(bytes.subarray(0, 8).toString('latin1'), '\x89PNG\r\n\x1a\n', 'PNG 头不对')
  // IHDR 宽高就在第 16..23 字节
  assert.equal(bytes.readUInt32BE(16), 32, 'PNG 宽度应为 32')
  assert.equal(bytes.readUInt32BE(20), 32, 'PNG 高度应为 32')
})

check('图形定义与 index.html 里的图标完全一致（改图形不会漏改一边）', () => {
  const out = execFileSync('python3', [fileURLToPath(new URL('make_favicon.py', root)), '--check'], {
    encoding: 'utf8',
  })
  assert.match(out, /一致/)
})

check('图标是正方形 viewBox，缩到 16px 不变形', () => {
  const { svg } = iconHrefs()
  const source = decodeURIComponent(svg.slice('data:image/svg+xml,'.length))
  const m = source.match(/viewBox='([\d\s.-]+)'/)
  assert.ok(m, '缺少 viewBox')
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number)
  assert.equal(w, h, 'viewBox 不是正方形，页签里会被拉变形')
})

check('图标底色是深海军蓝、刊头是古金（跟界面同一套色）', () => {
  const source = decodeURIComponent(iconHrefs().svg.slice('data:image/svg+xml,'.length))
  assert.ok(source.includes("fill='#1c2644'"), '缺少深海军蓝底')
  assert.ok(source.includes("fill='#c8a870'"), '缺少古金刊头')
})

check('顶栏五个动作按钮都有图标（含排版开关）', () => {
  for (const icon of ['Archive', 'ImageDown', 'Copy', 'FileDown', 'SlidersHorizontal']) {
    assert.ok(new RegExp(`\\b${icon}\\b`).test(header), `Header.tsx 没有用 ${icon} 图标`)
  }
  assert.equal((header.match(/<Glyph icon=/g) ?? []).length, 5, '应当正好五个按钮带图标')
})

check('按钮文案已从「打印 PDF」改成「导出 PDF」', () => {
  assert.ok(header.includes('导出 PDF'), '顶栏没找到「导出 PDF」')
  assert.ok(!header.includes('打印 PDF'), '还留着「打印 PDF」')
})

check('外壳切换用太阳和月亮', () => {
  assert.match(header, /SHELL_ICON\s*=\s*{\s*light:\s*Sun\s*,\s*dark:\s*Moon\s*}/)
})

/** SHELLS 里的中文名是给 aria-label / title 用的，图标化了也不能删 */
check('日月的无障碍文案仍带外壳全称', () => {
  assert.ok(header.includes('aria-label={`外壳：${s.name}`}'))
  assert.ok(header.includes('title={`外壳：${s.name}`}'))
})

check('电话 / 邮箱图标是细线矢量，跟地球图标同一套描边', () => {
  for (const icon of ['PhoneIcon', 'MailIcon']) {
    assert.ok(new RegExp(`export function ${icon}\\b`).test(brandIcons), `BrandIcons 缺 ${icon}`)
  }
  // 两个图标都得是 currentColor 描边，不能写死颜色，否则深色外壳下看不见
  const phone = brandIcons.slice(brandIcons.indexOf('export function PhoneIcon'))
  assert.match(phone, /stroke="currentColor"/)
  assert.match(phone, /fill="none"/)
})

check('左栏电话 / 邮箱字段标签带上了图标', () => {
  assert.match(editorPanel, /<PhoneIcon[^>]*\/>[\s\S]{0,40}电话/)
  assert.match(editorPanel, /<MailIcon[^>]*\/>[\s\S]{0,40}邮箱/)
})

check('纸面四套主题都用了 ContactItem 显示电话邮箱', () => {
  // 共用组件必须在场，且至少在 minimal / business / tech / academic 各出现一次
  assert.ok(/function ContactItem\b/.test(preview), '缺共用的 ContactItem')
  const uses = preview.split('ContactItem').length - 1
  assert.ok(uses >= 8, `ContactItem 出现 ${uses} 次，四套主题的电话邮箱应都覆盖到`)
  // tech 的字段表值也换成了 ReactNode，不能再是裸字符串
  assert.match(preview, /k: 'TEL'[\s\S]{0,80}ContactItem/)
  assert.match(preview, /k: 'MAIL'[\s\S]{0,80}ContactItem/)
})

console.log(`\n品牌与顶栏 ${passed} 项全部通过`)
