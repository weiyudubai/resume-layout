#!/usr/bin/env node
/**
 * 导出文件名校验：日期取导出当天（2026.11.18 点分隔），后接姓名-岗位，清洗非法字符。
 * 跑法：cd app && npm test
 */
import assert from 'node:assert/strict'
import { exportFileName } from '../src/export-name.ts'

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

const d = (y, m, day) => new Date(y, m - 1, day)

check('日期用点分隔，格式 2026.11.18-姓名-岗位', () => {
  assert.equal(
    exportFileName({ name: '张三', jobTitle: '高级前端工程师' }, d(2026, 11, 18)),
    '2026.11.18-张三-高级前端工程师',
  )
})

check('月和日补零，个位数月份不会写成 2026.1.5', () => {
  assert.equal(exportFileName({ name: '张三', jobTitle: '工程师' }, d(2026, 1, 5)), '2026.01.05-张三-工程师')
})

check('日期永远在最前，取的是传入的导出当天不是硬编码', () => {
  const a = exportFileName({ name: '李四', jobTitle: '设计师' }, d(2025, 3, 9))
  const b = exportFileName({ name: '李四', jobTitle: '设计师' }, d(2027, 12, 31))
  assert.equal(a, '2025.03.09-李四-设计师')
  assert.equal(b, '2027.12.31-李四-设计师')
  assert.ok(a.startsWith('2025.') && b.startsWith('2027.'))
})

check('姓名或岗位带空格会被去掉', () => {
  assert.equal(
    exportFileName({ name: '张 三', jobTitle: '高级 前端 工程师' }, d(2026, 11, 18)),
    '2026.11.18-张三-高级前端工程师',
  )
})

check('文件名非法字符被清洗，不会存不下来', () => {
  assert.equal(
    exportFileName({ name: '张/三', jobTitle: '前端:工程师?' }, d(2026, 11, 18)),
    '2026.11.18-张三-前端工程师',
  )
})

check('姓名空只用岗位，岗位空只用姓名', () => {
  assert.equal(exportFileName({ name: '', jobTitle: '工程师' }, d(2026, 11, 18)), '2026.11.18-工程师')
  assert.equal(exportFileName({ name: '张三', jobTitle: '' }, d(2026, 11, 18)), '2026.11.18-张三')
})

check('姓名岗位都空时仍有可读文件名，不会只剩日期', () => {
  assert.equal(exportFileName({ name: '', jobTitle: '' }, d(2026, 11, 18)), '2026.11.18-简历')
})

check('不传日期时用今天（默认参数），仍是点分隔格式', () => {
  assert.match(exportFileName({ name: '张三', jobTitle: '工程师' }), /^\d{4}\.\d{2}\.\d{2}-/)
})

console.log(`\n导出文件名 ${passed} 项全部通过`)
