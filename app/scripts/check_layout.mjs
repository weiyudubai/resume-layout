#!/usr/bin/env node
/**
 * 排版微调校验：
 *  1) 纯函数（layout.ts）：档位收敛、解析坏数据、步进、复位判断、字体表；
 *  2) 接线一致性：四套主题的字号/行距/页边距都写成 calc(var(--fs|--lh|--pad))，
 *     照片尺寸写成 calc(var(--photo))，默认值 1 时与原 px 等价；
 *     纸面根容器下发四个 CSS 变量 + data-font；
 *     顶栏有「排版」开关，工具条在顶栏下方占文档流（不是浮层，不盖纸面）。
 * 跑法：cd app && npm test
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_LAYOUT,
  FONT_PRESETS,
  FONT_SCALE_STEPS,
  LINE_SCALE_STEPS,
  MARGIN_SCALE_STEPS,
  PHOTO_SCALE_STEPS,
  clampLayout,
  fontCss,
  isDefaultLayout,
  isFontId,
  parseLayout,
  scaleLabel,
  stepScale,
} from '../src/layout.ts'

const root = new URL('../', import.meta.url)
const read = (p) => readFileSync(new URL(p, root), 'utf8')
const themes = read('src/themes.ts')
const preview = read('src/components/ResumePreview.tsx')
const header = read('src/components/Header.tsx')
const panel = read('src/components/LayoutPanel.tsx')
const app = read('src/App.tsx')
const css = read('src/index.css')

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

console.log('排版微调：')
check('默认值全部等于现状：四个倍率为 1、字体 default', () => {
  assert.deepEqual(DEFAULT_LAYOUT, {
    fontScale: 1,
    lineScale: 1,
    font: 'default',
    photoScale: 1,
    marginScale: 1,
  })
  assert.equal(isDefaultLayout(DEFAULT_LAYOUT), true)
  assert.equal(isDefaultLayout({ ...DEFAULT_LAYOUT, fontScale: 1.05 }), false)
  assert.equal(isDefaultLayout({ ...DEFAULT_LAYOUT, font: 'heiti' }), false)
  assert.equal(isDefaultLayout({ ...DEFAULT_LAYOUT, marginScale: 0.9 }), false)
})

check('档位表：都含 1、单调递增', () => {
  for (const steps of [FONT_SCALE_STEPS, LINE_SCALE_STEPS, PHOTO_SCALE_STEPS, MARGIN_SCALE_STEPS]) {
    assert.ok(steps.includes(1), '档位必须含 1（现状）')
    for (let i = 1; i < steps.length; i++) assert.ok(steps[i] > steps[i - 1])
  }
})

check('照片最大到 200%、页边距能收到 70%', () => {
  // 用户明确要求：照片别卡在 120%，页边距要能调小来凑一页
  assert.equal(PHOTO_SCALE_STEPS[PHOTO_SCALE_STEPS.length - 1], 2)
  assert.equal(MARGIN_SCALE_STEPS[0], 0.7)
})

check('clampLayout：收敛到最近档位', () => {
  assert.equal(clampLayout({ fontScale: 1.04 }).fontScale, 1.05)
  assert.equal(clampLayout({ fontScale: 0.99 }).fontScale, 1)
  assert.equal(clampLayout({ fontScale: 9 }).fontScale, 1.15)
  assert.equal(clampLayout({ lineScale: 1.13 }).lineScale, 1.1)
  assert.equal(clampLayout({ lineScale: 1.16 }).lineScale, 1.2)
  assert.equal(clampLayout({ photoScale: 0.85 }).photoScale, 0.8)
  assert.equal(clampLayout({ photoScale: 1.35 }).photoScale, 1.4)
  assert.equal(clampLayout({ marginScale: 0.73 }).marginScale, 0.7)
  assert.equal(clampLayout({ marginScale: 0.77 }).marginScale, 0.8)
  assert.equal(clampLayout({ marginScale: 1.3 }).marginScale, 1.2)
})

check('clampLayout：坏输入回退默认', () => {
  for (const bad of [null, undefined, 'x', 42, [], { fontScale: 'big' }, { font: 'comic' }]) {
    const r = clampLayout(bad)
    assert.equal(r.font === 'default' || FONT_PRESETS.some((p) => p.id === r.font), true)
    assert.ok([0.9, 0.95, 1, 1.05, 1.1, 1.15].includes(r.fontScale))
    assert.equal(r.marginScale, 1)
  }
  assert.equal(clampLayout({ font: 'kaiti' }).font, 'kaiti')
})

check('parseLayout：空值/坏 JSON 回退，正常值保留', () => {
  assert.deepEqual(parseLayout(null), DEFAULT_LAYOUT)
  assert.deepEqual(parseLayout(''), DEFAULT_LAYOUT)
  assert.deepEqual(parseLayout('not json'), DEFAULT_LAYOUT)
  assert.equal(parseLayout('{"fontScale":1.1,"font":"songti"}').fontScale, 1.1)
  assert.equal(parseLayout('{"fontScale":1.1,"font":"songti"}').font, 'songti')
  // 老版本只存了四个值：新加的页边距补 1，不能把老配置读坏
  assert.equal(
    parseLayout('{"fontScale":1.05,"lineScale":1.1,"font":"heiti","photoScale":1.2}').marginScale,
    1,
  )
  assert.equal(parseLayout('{"marginScale":0.8}').marginScale, 0.8)
})

check('stepScale：加减一步、到头停住', () => {
  assert.equal(stepScale(1, FONT_SCALE_STEPS, 1), 1.05)
  assert.equal(stepScale(1, FONT_SCALE_STEPS, -1), 0.95)
  assert.equal(stepScale(1.15, FONT_SCALE_STEPS, 1), 1.15)
  assert.equal(stepScale(0.9, FONT_SCALE_STEPS, -1), 0.9)
  assert.equal(stepScale(1, MARGIN_SCALE_STEPS, -1), 0.9)
  assert.equal(stepScale(0.7, MARGIN_SCALE_STEPS, -1), 0.7)
})

check('字体表：四套齐、default 无 CSS、其余为系统字体栈', () => {
  assert.equal(FONT_PRESETS.length, 4)
  assert.deepEqual(
    FONT_PRESETS.map((f) => f.id),
    ['default', 'heiti', 'songti', 'kaiti'],
  )
  assert.equal(fontCss('default'), '')
  for (const id of ['heiti', 'songti', 'kaiti']) {
    assert.ok(fontCss(id).length > 0)
    assert.equal(isFontId(id), true)
  }
  assert.equal(isFontId('nosuch'), false)
})

check('scaleLabel：百分比文案', () => {
  assert.equal(scaleLabel(1), '100%')
  assert.equal(scaleLabel(1.05), '105%')
  assert.equal(scaleLabel(0.9), '90%')
  assert.equal(scaleLabel(2), '200%')
})

check('themes.ts：四套主题的字号/行距/页边距都走 calc(var(--fs|--lh|--pad))', () => {
  // 四套主题各有一段，逐一确认含 fs / lh / pad 变量
  for (const id of ['minimal', 'business', 'tech', 'academic']) {
    const start = themes.indexOf(`${id}: {`)
    assert.ok(start >= 0, `themes 缺 ${id}`)
    const end = themes.indexOf('\n  },', start)
    const block = themes.slice(start, end)
    assert.match(block, /--fs/, `${id} 字号未接 --fs`)
    assert.match(block, /--lh/, `${id} 行距未接 --lh`)
    assert.match(block, /p-\[calc\(\d+px\*var\(--pad,1\)\)\]/, `${id} 页边距未接 --pad`)
  }
  // 不能残留未经 calc 包装的绝对 px 字号
  assert.equal(/text-\[\d+(\.\d+)?px\]/.test(themes), false, 'themes 仍有裸 px 字号')
})

check('themes.ts：默认基准值没被改坏（仍含原 px 数字）', () => {
  // calc 里必须带着原基准，默认 var=1 才等于现状
  assert.match(themes, /calc\(12\.5px\*var\(--fs,1\)\)/) // minimal li/p
  assert.match(themes, /calc\(13\.5px\*var\(--fs,1\)\)/) // business li/p
  assert.match(themes, /calc\(12px\*var\(--fs,1\)\)/) // tech li/p
  assert.match(themes, /calc\(1\.9\*var\(--lh,1\)\)/) // minimal leading
  assert.match(themes, /calc\(1\.78\*var\(--lh,1\)\)/) // tech leading
  assert.match(themes, /calc\(48px\*var\(--pad,1\)\)/) // minimal / academic 原 p-12
  assert.match(themes, /calc\(40px\*var\(--pad,1\)\)/) // business / tech 原 p-10
})

check('themes.ts：二级标题明显大于正文与三级标题（用户要求跟正文拉开）', () => {
  const px = (block, key) => {
    const m = block.match(new RegExp(`${key}: '[^']*?calc\\(([\\d.]+)px\\*var\\(--fs,1\\)\\)`))
    assert.ok(m, `${key} 未接 --fs`)
    return Number(m[1])
  }
  for (const id of ['minimal', 'business', 'tech', 'academic']) {
    const start = themes.indexOf(`${id}: {`)
    const end = themes.indexOf('\n  },', start)
    const block = themes.slice(start, end)
    const h2 = px(block, 'h2')
    const h3 = px(block, 'h3')
    const body = px(block, 'li')
    assert.ok(h2 > body + 1, `${id} 二级标题 ${h2}px 没比正文 ${body}px 大出明显差距`)
    assert.ok(h2 >= h3, `${id} 二级标题 ${h2}px 不应小于三级标题 ${h3}px`)
  }
})

check('ResumePreview：照片都走 calc(var(--photo))，纸面下发四个变量与 data-font', () => {
  assert.equal((preview.match(/var\(--photo,1\)/g) || []).length >= 5, true, '照片尺寸未全部接 --photo')
  assert.match(preview, /'--fs':\s*layout\.fontScale/)
  assert.match(preview, /'--lh':\s*layout\.lineScale/)
  assert.match(preview, /'--photo':\s*layout\.photoScale/)
  assert.match(preview, /'--pad':\s*layout\.marginScale/)
  assert.match(preview, /data-font=\{layout\.font\}/)
})

check('LayoutPanel：五项微调 + 复位 + 占文档流不浮层', () => {
  assert.match(panel, /排版微调/)
  for (const label of ['字号', '行距', '照片', '页边距']) {
    assert.match(panel, new RegExp(`label="${label}"`), `面板缺 ${label} 步进器`)
  }
  assert.match(panel, /FONT_PRESETS\.map/)
  assert.match(panel, /全部复位/)
  assert.match(panel, /onChange\(DEFAULT_LAYOUT\)/)
  // 工具条是文档流里的一行：不能再用 absolute / fixed 浮在纸面上
  assert.equal(/className="[^"]*\b(absolute|fixed)\b/.test(panel), false, '排版工具条不能是浮层')
  assert.match(panel, /border-b border-edge/)
  assert.match(panel, /whitespace-nowrap/, '页边距标签不能被挤成竖排')
  assert.match(panel, /layout-toolbar/, '工具条要有自己的类，打印时才藏得掉')
  assert.match(css, /@media print \{[\s\S]*\.layout-toolbar[\s\S]*?display: none/, '打印时工具条必须隐藏')
})

check('App + Header：排版开关与工具条接线，工具条在顶栏之后', () => {
  assert.match(header, /layoutOpen: boolean/)
  assert.match(header, /onToggleLayout: \(\) => void/)
  assert.match(header, /aria-expanded=\{layoutOpen\}/)
  assert.equal(/<LayoutPanel/.test(header), false, '工具条不该再塞进顶栏')

  assert.match(app, /layoutOpen=\{layoutOpen\}/)
  assert.match(app, /onToggleLayout=/)
  const headerAt = app.indexOf('<Header')
  const toolbar = app.indexOf('<LayoutPanel')
  assert.ok(headerAt >= 0 && toolbar > headerAt, '工具条应渲染在顶栏之后')
  assert.match(app, /layoutOpen && \(/)
})

check('index.css：三套字体组合的 data-font 覆盖规则在', () => {
  for (const id of ['heiti', 'songti', 'kaiti']) {
    assert.match(css, new RegExp(`data-font='${id}'`))
  }
  assert.match(css, /PingFang SC/)
  assert.match(css, /Songti SC/)
  assert.match(css, /KaiTi/)
})

console.log(`\n${passed} 项通过`)
