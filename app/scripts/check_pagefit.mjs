// 页数换算的回归校验：把内容高度换成页数、占比与是否溢出。
// 跑法：cd app && npm test
import assert from 'node:assert/strict'
import { pageFit, A4_HEIGHT_PX } from '../src/pagefit.ts'

let pass = 0
const check = (name, fn) => {
  fn()
  pass++
  console.log(`  ✓ ${name}`)
}

console.log('pageFit')

check('空内容至少算一页', () => {
  const r = pageFit(0)
  assert.equal(r.pages, 1)
  assert.equal(r.fit, 0)
  assert.equal(r.overflow, false)
})

check('刚好一页不溢出', () => {
  const r = pageFit(A4_HEIGHT_PX)
  assert.equal(r.pages, 1)
  assert.equal(r.fit, 1)
  assert.equal(r.overflow, false)
})

check('超出一点就翻到第二页', () => {
  const r = pageFit(A4_HEIGHT_PX + 2)
  assert.equal(r.pages, 2)
  assert.equal(r.overflow, true)
})

check('两页以内仍算两页', () => {
  const r = pageFit(A4_HEIGHT_PX * 1.44)
  assert.equal(r.pages, 2)
  assert.equal(r.overflow, true)
  assert.ok(Math.abs(r.fit - 1.44) < 1e-9)
})

check('脏数据不炸', () => {
  for (const bad of [NaN, -100, Infinity]) {
    const r = pageFit(bad)
    assert.equal(Number.isFinite(r.fit), true)
    assert.equal(r.pages >= 1, true)
  }
})

console.log(`\n${pass} 项通过`)
