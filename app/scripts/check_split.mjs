#!/usr/bin/env node
/**
 * 左栏上下分栏校验：拖动高度夹取、记忆值解析、默认比例。
 * 跑法：cd app && npm test（Node 24 原生跑 .ts，不需要编译）
 */
import assert from 'node:assert/strict'
import {
  MIN_EDITOR_H,
  MIN_INFO_H,
  SPLIT_KEY,
  clampInfoHeight,
  defaultInfoHeight,
  parseInfoHeight,
} from '../src/split.ts'

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

check('分栏高度存在自己的键里，不跟表单数据混', () => {
  assert.equal(SPLIT_KEY, 'resume-assistant-split')
})

check('上下限是正常数字，且下方要留得下编辑区', () => {
  assert.ok(MIN_INFO_H > 0)
  assert.ok(MIN_EDITOR_H > MIN_INFO_H, '编辑区下限必须比信息区下限大，否则窗口矮时没有解')
})

check('拖动结果夹在上下限之间', () => {
  // 1000px 高的左栏：信息区最多 1000-220=780
  assert.equal(clampInfoHeight(300, 1000), 300)
  assert.equal(clampInfoHeight(10, 1000), MIN_INFO_H, '拖到顶也不能小于下限')
  assert.equal(clampInfoHeight(9999, 1000), 1000 - MIN_EDITOR_H, '拖到底也要给编辑区留 220px')
})

check('正好压在下限与上限上时原样返回', () => {
  assert.equal(clampInfoHeight(MIN_INFO_H, 1000), MIN_INFO_H)
  assert.equal(clampInfoHeight(780, 1000), 780)
})

check('窗口太矮时不返回负数，优先保住信息区下限', () => {
  assert.equal(clampInfoHeight(400, 300), MIN_INFO_H)
  assert.equal(clampInfoHeight(400, MIN_INFO_H + MIN_EDITOR_H), MIN_INFO_H)
})

check('非法输入回落到下限，不给 NaN 进样式', () => {
  assert.equal(clampInfoHeight(Number.NaN, 1000), MIN_INFO_H)
  assert.equal(clampInfoHeight(300, Number.NaN), MIN_INFO_H)
  assert.equal(clampInfoHeight(300, 0), MIN_INFO_H)
  assert.equal(clampInfoHeight(300, -50), MIN_INFO_H)
})

check('拖动结果取整，避免亚像素高度抖动', () => {
  assert.equal(clampInfoHeight(300.6, 1000), 301)
  assert.equal(clampInfoHeight(300.4, 1000), 300)
})

check('记住的高度能读回来', () => {
  assert.equal(parseInfoHeight('420'), 420)
  assert.equal(parseInfoHeight(' 420 '), 420)
  assert.equal(parseInfoHeight('420.7'), 421)
  assert.equal(parseInfoHeight(420), 420)
})

check('空值 / 坏值一律当作没记过', () => {
  for (const bad of ['', '   ', 'abc', 'NaN', 'Infinity', '0', '-5', null, undefined, {}, []]) {
    assert.equal(parseInfoHeight(bad), null, `${JSON.stringify(bad)} 应回落到默认比例`)
  }
})

check('默认比例是左栏高度的 42%，并已被夹过', () => {
  assert.equal(defaultInfoHeight(892), Math.round(892 * 0.42))
  assert.equal(defaultInfoHeight(400), 168, '400*0.42=168，落在合法区间内就原样用')
  assert.equal(defaultInfoHeight(300), MIN_INFO_H, '300*0.42=126 低于下限，要抬到下限')
  assert.equal(defaultInfoHeight(0), MIN_INFO_H)
})

console.log(`\n左栏分栏 ${passed} 项全部通过`)
