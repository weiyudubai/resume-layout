#!/usr/bin/env node
/**
 * 版本存档校验：命名、指纹、排序、增删改、导入导出往返、脏数据兜底。
 * 跑法：cd app && npm test（Node 24 原生跑 .ts，不需要编译）
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  BACKUP_FORMAT,
  BACKUP_KIND,
  VERSIONS_KEY,
  backupPayload,
  dateStamp,
  defaultVersionName,
  findSameVersion,
  formatBytes,
  formatVersionTime,
  jsonBytes,
  markdownCharCount,
  mergeVersions,
  newVersionId,
  parseVersions,
  removeVersion,
  renameVersion,
  resumeFingerprint,
  sortVersions,
  upsertVersion,
  versionsBytes,
} from '../src/versions.ts'

let passed = 0
const check = (name, fn) => {
  fn()
  passed++
  console.log(`✓ ${name}`)
}

/** 造一份最小可用的简历数据 */
const resume = (over = {}) => ({
  name: '张三',
  jobTitle: '高级前端工程师',
  phone: '138-0000-8888',
  email: 'zhangsan@example.com',
  tagline: '定位',
  photo: null,
  wechat: '示例账号',
  xiaohongshu: '示例账号',
  github: 'example',
  markdown: '## 个人简介\n你好',
  ...over,
})

const version = (over = {}) => ({
  id: 'v1',
  name: '字节 · 高级前端',
  savedAt: 1000,
  theme: 'tech',
  data: resume(),
  ...over,
})

check('存档键名带命名空间，避免和别的本地页面撞车', () => {
  assert.equal(VERSIONS_KEY, 'resume-assistant-versions')
  assert.equal(BACKUP_KIND, 'resume-assistant-versions')
  assert.equal(BACKUP_FORMAT, 1)
})

check('newVersionId 不重复且可读', () => {
  const a = newVersionId(1000, 0.1)
  const b = newVersionId(1000, 0.9)
  assert.notEqual(a, b)
  assert.ok(a.startsWith('v'))
  assert.ok(!/[^a-z0-9-]/.test(a), '只含小写字母数字与连字符')
})

check('日期尾巴与存档名共用同一个格式', () => {
  assert.equal(dateStamp(new Date(2026, 10, 17)), '11月17日')
  assert.equal(dateStamp(new Date(2026, 0, 5)), '1月5日')
  assert.ok(
    defaultVersionName(resume(), new Date(2026, 10, 17)).endsWith(dateStamp(new Date(2026, 10, 17))),
    '存档名的日期部分必须来自 dateStamp，免得两处格式漂移',
  )
})

check('默认版本名用意向岗位 + 日期', () => {
  assert.equal(defaultVersionName(resume(), new Date(2026, 7, 12)), '高级前端工程师 · 8月12日')
})

check('没填岗位就用姓名，都没有叫未命名', () => {
  assert.equal(defaultVersionName(resume({ jobTitle: '  ' }), new Date(2026, 0, 3)), '张三 · 1月3日')
  assert.equal(
    defaultVersionName(resume({ jobTitle: '', name: '' }), new Date(2026, 0, 3)),
    '未命名 · 1月3日',
  )
})

check('字数统计去掉所有空白', () => {
  assert.equal(markdownCharCount('## 个人简介\n\n你好 世界'), 10)
})

check('指纹与字段顺序无关', () => {
  const a = { b: 1, a: 2, c: null }
  const b = { c: null, a: 2, b: 1 }
  assert.equal(resumeFingerprint(a), resumeFingerprint(b))
})

check('指纹能区分内容差异', () => {
  assert.notEqual(
    resumeFingerprint(resume({ markdown: 'A' })),
    resumeFingerprint(resume({ markdown: 'B' })),
  )
  assert.notEqual(
    resumeFingerprint(resume({ photo: null })),
    resumeFingerprint(resume({ photo: 'data:image/png;base64,x' })),
  )
})

check('findSameVersion 认得出「已经存过」', () => {
  const v = version({ data: resume() })
  assert.ok(findSameVersion([v], resume()))
  assert.equal(findSameVersion([v], resume({ markdown: '改过了' })), undefined)
})

check('列表按时间倒序，且不改原数组', () => {
  const list = [version({ id: 'a', savedAt: 1 }), version({ id: 'b', savedAt: 3 })]
  const sorted = sortVersions(list)
  assert.deepEqual(sorted.map((v) => v.id), ['b', 'a'])
  assert.deepEqual(list.map((v) => v.id), ['a', 'b'], '原数组保持不变')
})

check('同 id 重新存档会覆盖，不会多出一条', () => {
  const list = [version({ id: 'a', name: '旧' })]
  const next = upsertVersion(list, version({ id: 'a', name: '新', savedAt: 2000 }))
  assert.equal(next.length, 1)
  assert.equal(next[0].name, '新')
})

check('删除按 id 生效', () => {
  const list = [version({ id: 'a' }), version({ id: 'b' })]
  assert.deepEqual(removeVersion(list, 'a').map((v) => v.id), ['b'])
  assert.equal(removeVersion(list, '不存在').length, 2)
})

check('改名去掉首尾空格，空名字不生效', () => {
  const list = [version({ id: 'a', name: '旧' })]
  assert.equal(renameVersion(list, 'a', '  新名字  ')[0].name, '新名字')
  assert.equal(renameVersion(list, 'a', '   ')[0].name, '旧')
})

check('导入备份时同 id 以本地为准', () => {
  const local = [version({ id: 'a', name: '本地' })]
  const incoming = [version({ id: 'a', name: '外来' }), version({ id: 'b', name: '新的', savedAt: 5 })]
  const merged = mergeVersions(local, incoming)
  assert.equal(merged.length, 2)
  assert.equal(merged.find((v) => v.id === 'a').name, '本地')
})

check('parseVersions：空值与坏 JSON 都返回空列表', () => {
  assert.deepEqual(parseVersions(null), [])
  assert.deepEqual(parseVersions(''), [])
  assert.deepEqual(parseVersions('{不是 JSON'), [])
  assert.deepEqual(parseVersions('"一段字符串"'), [])
  assert.deepEqual(parseVersions('{"foo":1}'), [])
})

check('parseVersions：裸数组与备份对象都能读', () => {
  const bare = JSON.stringify([version()])
  const wrapped = backupPayload([version()], 5000)
  assert.equal(parseVersions(bare).length, 1)
  assert.equal(parseVersions(wrapped).length, 1)
})

check('parseVersions：脏记录逐条丢弃，不拖垮整个列表', () => {
  const raw = JSON.stringify([
    version({ id: 'good' }),
    { id: '', savedAt: 1, data: resume() }, // id 为空
    { id: 'x', savedAt: 'yesterday', data: resume() }, // 时间不是数字
    { id: 'y', savedAt: 1 }, // 没有 data
    null,
    '字符串',
    version({ id: 'also-good', savedAt: 2 }),
  ])
  assert.deepEqual(parseVersions(raw).map((v) => v.id), ['good', 'also-good'])
})

check('parseVersions：重复 id 只留第一条', () => {
  const raw = JSON.stringify([version({ id: 'a', name: '先' }), version({ id: 'a', name: '后' })])
  const out = parseVersions(raw)
  assert.equal(out.length, 1)
  assert.equal(out[0].name, '先')
})

check('parseVersions：缺字段的旧存档用默认值补齐', () => {
  const raw = JSON.stringify([{ id: 'old', savedAt: 1, data: { markdown: '## 只剩正文' } }])
  const [v] = parseVersions(raw)
  assert.equal(v.data.name, '张三')
  assert.equal(v.data.email, 'zhangsan@example.com')
  assert.equal(v.data.markdown, '## 只剩正文')
  assert.equal(v.name, '未命名')
  assert.equal(v.theme, 'tech', '主题不认识时回退')
})

check('parseVersions 认识的主题原样保留', () => {
  const raw = JSON.stringify([version({ theme: 'academic' })])
  assert.equal(parseVersions(raw)[0].theme, 'academic')
})

check('备份文件导出再导入，内容一致', () => {
  const list = [version({ id: 'a', savedAt: 20 }), version({ id: 'b', savedAt: 10 })]
  const [a, b] = parseVersions(backupPayload(list, 999))
  assert.equal(a.id, 'a')
  assert.equal(b.id, 'b')
  assert.equal(a.data.markdown, list[0].data.markdown)
})

check('体积换算看得懂', () => {
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(2048), '2.0 KB')
  assert.equal(formatBytes(3 * 1024 * 1024), '3.0 MB')
  assert.ok(jsonBytes('中文') >= 6, 'UTF-8 下中文占 3 字节')
  assert.ok(versionsBytes([version()]) > 0)
})

check('存档时间说人话', () => {
  const now = new Date(2026, 7, 12, 14, 32).getTime()
  assert.equal(formatVersionTime(now - 10_000, now), '刚刚')
  assert.equal(formatVersionTime(now - 12 * 60_000, now), '12 分钟前')
  assert.equal(formatVersionTime(new Date(2026, 7, 12, 9, 5).getTime(), now), '今天 09:05')
  assert.equal(formatVersionTime(new Date(2026, 6, 3, 9, 5).getTime(), now), '7月3日 09:05')
  assert.equal(formatVersionTime(Number.NaN, now), '')
})

check('恢复版本后会自动落盘，不用再手点保存', () => {
  const appSrc = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8')
  // 只看 restoreVersion 这一段，避免匹配到别处的保存逻辑
  const start = appSrc.indexOf('const restoreVersion = useCallback(')
  assert.ok(start > 0, '找不到 restoreVersion')
  const end = appSrc.indexOf('\n  const ', start + 10)
  const block = appSrc.slice(start, end > 0 ? end : undefined)
  assert.ok(block.includes('saveJSONOk(STORAGE_KEY'), '恢复后必须写回 localStorage')
  assert.ok(block.includes('setSaved(true)'), '恢复后要提示已保存')
  assert.ok(
    block.includes('但存不进去：浏览器存储空间满了'),
    '写失败时要说实话，不能假装存好了',
  )
})

console.log(`\n版本存档 ${passed} 项全部通过`)
