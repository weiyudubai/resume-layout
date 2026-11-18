// 外壳切换（深海军蓝 / 暖米）的回归校验。
// 校验的是「切换这个动作依赖的一整套约定」，避免以后改了颜色变量却漏了某一档。
// 跑法：cd app && npm test
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SHELLS, DEFAULT_SHELL, isShellId } from '../src/shell.ts'

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

let pass = 0
const check = (name, fn) => {
  fn()
  pass++
  console.log(`  ✓ ${name}`)
}

/** 取出 CSS 里某个块的内容：按花括号配对，不受嵌套影响 */
function cssBlock(src, marker) {
  const i = src.indexOf(marker)
  assert.ok(i >= 0, `CSS 里找不到 ${marker}`)
  const start = src.indexOf('{', i)
  let depth = 0
  for (let j = start; j < src.length; j++) {
    if (src[j] === '{') depth++
    else if (src[j] === '}') {
      depth--
      if (depth === 0) return src.slice(start + 1, j)
    }
  }
  throw new Error(`${marker} 的花括号没配对`)
}

/** 块里定义的自定义属性名 */
function cssVars(block) {
  return [...block.matchAll(/(--c-[a-z0-9-]+)\s*:/g)].map((m) => m[1]).sort()
}

console.log('外壳切换')

check('只有深海军蓝与暖米两档外壳', () => {
  assert.deepEqual(
    SHELLS.map((s) => s.id),
    ['dark', 'light'],
  )
})

check('每档外壳都有标签与全称', () => {
  for (const s of SHELLS) {
    assert.ok(s.label && s.label.length <= 2, `${s.id} 的标签应是一两个字`)
    assert.ok(s.name && s.name.length >= 2, `${s.id} 缺全称`)
  }
})

check('默认外壳是深海军蓝', () => {
  assert.equal(DEFAULT_SHELL, 'dark')
  assert.ok(SHELLS.some((s) => s.id === DEFAULT_SHELL))
})

check('isShellId 只认这两个值', () => {
  assert.equal(isShellId('dark'), true)
  assert.equal(isShellId('light'), true)
  assert.equal(isShellId('gray'), false)
  assert.equal(isShellId(''), false)
  assert.equal(isShellId(null), false)
  assert.equal(isShellId(undefined), false)
  assert.equal(isShellId(0), false)
})

const html = read('../index.html')
const css = read('../src/index.css')
const tw = read('../tailwind.config.js')
const appSrc = read('../src/App.tsx')
const headerSrc = read('../src/components/Header.tsx')

const rootVars = cssVars(cssBlock(css, ':root'))
const lightVars = cssVars(cssBlock(css, "[data-shell='light']"))
const usedVars = [
  ...new Set([...tw.matchAll(/var\((--c-[a-z0-9-]+)\)/g)].map((m) => m[1])),
].sort()

check('首帧默认深色，不会闪一下默认色', () => {
  assert.match(html, /<html[^>]*data-shell="dark"/)
  // 首帧脚本必须读同一个持久化键，否则刷新后先深后浅
  assert.ok(html.includes("localStorage.getItem('resume-assistant-shell')"))
})

check('Tailwind 用到的外壳变量在两档里都定义了', () => {
  assert.ok(usedVars.length > 0, 'Tailwind 里应当有变量化的外壳色')
  for (const v of usedVars) {
    assert.ok(rootVars.includes(v), `:root 缺少 --${v}`)
    assert.ok(lightVars.includes(v), `[data-shell='light'] 缺少 --${v}`)
  }
})

check('两档外壳定义的变量完全一致，不会漏配', () => {
  assert.deepEqual(rootVars, lightVars)
})

check('App 把外壳写到根元素并用同一个键持久化', () => {
  assert.ok(appSrc.includes('document.documentElement.dataset.shell = shell'))
  assert.ok(appSrc.includes("'resume-assistant-shell'"))
})

check('顶栏有外壳切换器', () => {
  assert.ok(headerSrc.includes('SHELLS.map'), '切换器应按 SHELLS 渲染')
  assert.ok(headerSrc.includes('onShellChange'), '切换器应能回调切换')
})

check('纸面永远是白纸：外壳变了也不影响打印', () => {
  const paper = cssBlock(css, '.a4-paper')
  assert.match(paper, /background:\s*white/, '纸面必须是白底')
  const print = cssBlock(css, '@media print')
  assert.match(print, /\.workbench[^}]*background:\s*#fff\s*!important/)
})

// .btn:hover 的优先级高于 .btn-solid，金色实心按钮悬停时文字会变成金色，金底金字看不见
check('实心按钮悬停时文字仍是深色', () => {
  const solidHoverAt = css.indexOf('.btn-solid:hover')
  const btnHoverAt = css.indexOf('.btn:hover')
  assert.ok(solidHoverAt > 0, '缺少 .btn-solid:hover 覆盖规则')
  assert.ok(
    solidHoverAt > btnHoverAt,
    '.btn-solid:hover 必须写在 .btn:hover 之后，同优先级靠顺序取胜',
  )
  const solidHover = cssBlock(css, '.btn-solid:hover')
  assert.match(solidHover, /text-shell/, '悬停态必须把文字色改回 text-shell')
})
