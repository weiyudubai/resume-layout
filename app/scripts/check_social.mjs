#!/usr/bin/env node
/**
 * 社媒字段校验：GitHub / 小红书主页 / 个人网站输入归一化、条目过滤与排序。
 * 跑法：cd app && npm test（Node 24 原生跑 .ts，不需要编译）
 */
import assert from 'node:assert/strict'
import {
  githubHandle,
  socialAbbr,
  socialEntries,
  xiaohongshuHref,
  websiteDomain,
  websiteHref,
} from '../src/social.ts'
import { DEFAULT_DATA } from '../src/types.ts'

let passed = 0
const check = (name, fn) => {
  fn()
  passed++
  console.log(`✓ ${name}`)
}

check('GitHub 只填用户名', () => {
  assert.equal(githubHandle('example'), 'example')
})

check('GitHub 填完整主页 URL', () => {
  assert.equal(githubHandle('https://github.com/example'), 'example')
  assert.equal(githubHandle('http://www.github.com/example/'), 'example')
})

check('GitHub 填省略协议的主页', () => {
  assert.equal(githubHandle('github.com/example'), 'example')
})

check('GitHub 填具体仓库地址时取用户名', () => {
  assert.equal(githubHandle('https://github.com/example/resume-tool'), 'example')
})

check('GitHub 去掉首尾空格与 @', () => {
  assert.equal(githubHandle('  @example  '), 'example')
})

check('GitHub 为空时返回空串', () => {
  assert.equal(githubHandle(''), '')
  assert.equal(githubHandle('   '), '')
})

check('社媒全空时不产生条目', () => {
  assert.deepEqual(socialEntries({ wechat: '', xiaohongshu: '', github: '' }), [])
})

check('社媒按 公众号 → 小红书 → GitHub 排序，GitHub 带链接', () => {
  const entries = socialEntries({
    wechat: '示例账号',
    xiaohongshu: '示例账号',
    github: 'https://github.com/example',
  })
  assert.deepEqual(
    entries.map((e) => e.kind),
    ['wechat', 'xiaohongshu', 'github'],
  )
  assert.deepEqual(
    entries.map((e) => e.text),
    ['示例账号', '示例账号', 'github.com/example'],
  )
  assert.equal(entries[0].href, undefined)
  assert.equal(entries[1].href, undefined)
  assert.equal(entries[2].href, 'https://github.com/example')
})

check('handle 字段给紧凑版式用：GitHub 只给账号名', () => {
  const entries = socialEntries({
    wechat: '示例账号',
    xiaohongshu: '示例账号',
    github: 'https://github.com/example',
  })
  assert.deepEqual(
    entries.map((e) => e.handle),
    ['示例账号', '示例账号', 'example'],
  )
  assert.deepEqual(
    entries.map((e) => e.label),
    ['公众号', '小红书', 'GitHub'],
  )
})

check('单项为空时只输出填了的社媒', () => {
  const entries = socialEntries({ wechat: '  ', xiaohongshu: ' 示例账号 ', github: '' })
  assert.equal(entries.length, 1)
  assert.equal(entries[0].kind, 'xiaohongshu')
  assert.equal(entries[0].text, '示例账号')
})

check('个人网站去掉协议、www 和末尾斜杠', () => {
  assert.equal(websiteDomain('https://example.com/'), 'example.com')
  assert.equal(websiteDomain('http://www.example.com/'), 'example.com')
  assert.equal(websiteDomain('  example.com  '), 'example.com')
  assert.equal(websiteDomain(''), '')
  assert.equal(websiteDomain('   '), '')
})

check('个人网站链接没写协议就补 https://', () => {
  assert.equal(websiteHref('https://example.com/'), 'https://example.com/')
  assert.equal(websiteHref('example.com'), 'https://example.com')
  assert.equal(websiteHref(''), undefined)
})

check('个人网站空值不产生条目，填了就排在最后且带链接', () => {
  const base = { wechat: '示例账号', xiaohongshu: '示例账号', github: 'example' }
  assert.equal(socialEntries({ ...base, website: '' }).length, 3)
  const entries = socialEntries({ ...base, website: 'https://example.com/' })
  assert.deepEqual(
    entries.map((e) => e.kind),
    ['wechat', 'xiaohongshu', 'github', 'website'],
  )
  const web = entries[3]
  assert.equal(web.label, '个人网站')
  assert.equal(web.text, 'example.com')
  assert.equal(web.handle, 'example.com')
  assert.equal(web.href, 'https://example.com/')
})

check('小红书主页链接没写协议就补 https://，空值不产生链接', () => {
  const url = 'https://www.xiaohongshu.com/user/profile/000000000000000000000000'
  assert.equal(xiaohongshuHref(url), url)
  assert.equal(
    xiaohongshuHref('www.xiaohongshu.com/user/profile/000000000000000000000000'),
    'https://www.xiaohongshu.com/user/profile/000000000000000000000000',
  )
  assert.equal(xiaohongshuHref(''), undefined)
  assert.equal(xiaohongshuHref(undefined), undefined)
})

check('小红书接上主页后，纸面仍显示账号名但链接能点', () => {
  const url = 'https://www.xiaohongshu.com/user/profile/000000000000000000000000'
  const entries = socialEntries({ xiaohongshu: '示例账号', xiaohongshuUrl: url })
  assert.equal(entries.length, 1)
  assert.equal(entries[0].kind, 'xiaohongshu')
  assert.equal(entries[0].text, '示例账号')
  assert.equal(entries[0].handle, '示例账号')
  assert.equal(entries[0].href, url)
  // 老数据没有这个字段时，不凭空造链接
  assert.equal(socialEntries({ xiaohongshu: '示例账号' })[0].href, undefined)
})

check('默认数据的小红书主页保持为空', () => {
  assert.equal(DEFAULT_DATA.xiaohongshuUrl, '')
})

check('互联网风字段表给四个平台不同的短标签', () => {
  assert.equal(socialAbbr('wechat'), 'WX')
  assert.equal(socialAbbr('xiaohongshu'), 'RED')
  assert.equal(socialAbbr('github'), 'GH')
  assert.equal(socialAbbr('website'), 'WEB')
})

check('默认数据预填示例个人网站', () => {
  assert.equal(DEFAULT_DATA.website, 'https://example.com/')
})

console.log(`\n社媒校验通过：${passed} 项`)
