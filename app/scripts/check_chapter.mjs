// 章节序号（学术经典模板的中文序号）的回归校验。
// 跑法：cd app && npm test
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chineseNumeral } from '../src/chapter.ts'

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

let pass = 0
const check = (name, fn) => {
  fn()
  pass++
  console.log(`  ✓ ${name}`)
}

console.log('章节序号')

check('个位数', () => {
  assert.equal(chineseNumeral(1), '一')
  assert.equal(chineseNumeral(2), '二')
  assert.equal(chineseNumeral(9), '九')
})

check('十位不带一', () => {
  assert.equal(chineseNumeral(10), '十')
  assert.equal(chineseNumeral(20), '二十')
})

check('十几与几十几', () => {
  assert.equal(chineseNumeral(11), '十一')
  assert.equal(chineseNumeral(21), '二十一')
  assert.equal(chineseNumeral(99), '九十九')
})

check('越界或非法值退回原样', () => {
  assert.equal(chineseNumeral(100), '100')
  assert.equal(chineseNumeral(0), '0')
  assert.equal(chineseNumeral(-3), '-3')
  assert.equal(chineseNumeral(Number.NaN), 'NaN')
})

const themesSrc = read('../src/themes.ts')
const mdSrc = read('../src/markdown.tsx')

check('只有学术经典模板带中文序号', () => {
  // 按主题块切开再判断，避免跨块误匹配
  const ids = ['minimal', 'business', 'tech', 'academic']
  const numbered = ids.filter((id) => {
    const start = themesSrc.indexOf(`${id}: {`)
    assert.ok(start >= 0, `themes.ts 里找不到 ${id}`)
    const block = themesSrc.slice(start, themesSrc.indexOf('\n  },', start))
    return /numbered:\s*true/.test(block)
  })
  assert.deepEqual(numbered, ['academic'])
})

check('序号由渲染器生成，不写进 Markdown 内容', () => {
  assert.ok(mdSrc.includes('chineseNumeral(chapter)'), '渲染器应调用 chineseNumeral')
  assert.ok(mdSrc.includes('t.numbered'), '只有带序号的主题才渲染')
  assert.ok(/chineseNumeral/.test(read('../src/chapter.ts')))
})
