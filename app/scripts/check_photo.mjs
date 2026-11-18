#!/usr/bin/env node
/**
 * 照片压缩校验：缩放尺寸、是否算过大、字节数估算。
 * 跑法：cd app && npm test
 */
import assert from 'node:assert/strict'
import {
  PHOTO_MAX_BYTES,
  PHOTO_MAX_EDGE,
  PHOTO_QUALITY,
  dataUrlBytes,
  isOversized,
  targetSize,
} from '../src/photo.ts'

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

check('常量是合理的默认值', () => {
  assert.ok(PHOTO_MAX_EDGE >= 200, '长边太小，简历照片会糊')
  assert.ok(PHOTO_MAX_EDGE <= 1200, '长边太大，白占配额')
  assert.ok(PHOTO_QUALITY > 0.5 && PHOTO_QUALITY <= 1)
  assert.ok(PHOTO_MAX_BYTES < 1024 * 1024, '上限太大，等于没把关')
})

check('大图等比缩到长边上限', () => {
  const r = targetSize(4000, 3000)
  assert.equal(Math.max(r.w, r.h), PHOTO_MAX_EDGE)
  assert.equal(r.w, 600)
  assert.equal(r.h, 450)
})

check('竖着的照片按高度缩', () => {
  const r = targetSize(3000, 4000)
  assert.equal(r.w, 450)
  assert.equal(r.h, 600)
})

check('小图不放大（放大只会变大不会更清楚）', () => {
  const r = targetSize(120, 160)
  assert.equal(r.w, 120)
  assert.equal(r.h, 160)
})

check('刚好等于上限时原样返回', () => {
  const r = targetSize(600, 400)
  assert.deepEqual(r, { w: 600, h: 400 })
})

check('非法尺寸不产生 NaN', () => {
  for (const [w, h] of [[0, 0], [-1, 10], [10, -1], [Number.NaN, 10]]) {
    const r = targetSize(w, h)
    assert.ok(Number.isFinite(r.w) && Number.isFinite(r.h), `${w}x${h} 算出了非法尺寸`)
  }
})

check('缩放后宽高比保持不变', () => {
  const r = targetSize(4032, 3024)
  assert.ok(Math.abs(r.w / r.h - 4032 / 3024) < 0.01)
})

check('空照片不算过大', () => {
  assert.equal(isOversized(null), false)
  assert.equal(isOversized(undefined), false)
  assert.equal(isOversized(''), false)
})

check('小照片不算过大，大照片算过大', () => {
  const small = 'data:image/jpeg;base64,' + 'A'.repeat(1000)
  const big = 'data:image/jpeg;base64,' + 'A'.repeat(PHOTO_MAX_BYTES + 10)
  assert.equal(isOversized(small), false)
  assert.equal(isOversized(big), true)
})

check('判断大小时只算图片本身，不算 data URL 前缀', () => {
  const prefix = 'data:image/jpeg;base64,'
  const body = 'A'.repeat(PHOTO_MAX_BYTES - 1)
  assert.equal(isOversized(prefix + body), false, '前缀不该算进去')
})

check('字节数估算与 base64 长度对得上', () => {
  const raw = 'x'.repeat(3000)
  const b64 = Buffer.from(raw).toString('base64')
  const url = 'data:image/jpeg;base64,' + b64
  const bytes = dataUrlBytes(url)
  assert.ok(Math.abs(bytes - 3000) < 10, `估算 ${bytes} 字节，实际 3000`)
})

check('空照片的字节数是 0', () => {
  assert.equal(dataUrlBytes(null), 0)
  assert.equal(dataUrlBytes(''), 0)
})

console.log(`\n照片压缩 ${passed} 项全部通过`)
