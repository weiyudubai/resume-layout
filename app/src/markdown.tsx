import React from 'react'
import type { MdTheme } from './themes'
import { chineseNumeral } from './chapter'

/** 解析行内 Markdown：**加粗** 与 *斜体* */
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      nodes.push(<strong key={key++}>{tok.slice(2, -2)}</strong>)
    } else {
      nodes.push(<em key={key++}>{tok.slice(1, -1)}</em>)
    }
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

/** 极简 Markdown 渲染器：## / ### / *日期* / - 列表 / 表格 / *** / 段落 */
export function renderMarkdown(md: string, t: MdTheme): React.ReactNode[] {
  const lines = md.split('\n')
  const out: React.ReactNode[] = []
  let i = 0
  let key = 0
  let chapter = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    // 水平线
    if (/^(\*\*\*|---)$/.test(trimmed)) {
      out.push(<hr key={key++} className={t.hr} />)
      i++
      continue
    }

    // 二级标题
    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3)
      chapter++
      out.push(
        <div key={key++} className="relative group">
          <h2 className={t.h2}>
            {/* 学术经典：分节前加中文序号，序号由渲染器生成 */}
            {t.numbered && (
              <span className="font-mono text-[0.75em] tracking-[0.1em] text-gold-ink">
                {chineseNumeral(chapter)}
              </span>
            )}
            {renderInline(text)}
            {/* 创意设计主题：标题下方的高亮笔刷 */}
            {t.h2Highlight && (
              <span className="absolute -bottom-2 left-0 w-full h-3 bg-creative-accent opacity-20 -z-10 -rotate-2 rounded-sm" />
            )}
          </h2>
        </div>,
      )
      i++
      continue
    }

    // 三级标题
    if (trimmed.startsWith('### ')) {
      out.push(
        <h3 key={key++} className={t.h3}>
          {renderInline(trimmed.slice(4))}
        </h3>,
      )
      i++
      continue
    }

    // 表格
    if (trimmed.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim()
        if (!/^\|[\s\-|:]+\|$/.test(row)) rows.push(splitRow(row))
        i++
      }
      const [head, ...body] = rows
      out.push(
        <table key={key++} className={t.table}>
          {head && (
            <thead>
              <tr>
                {head.map((c, ci) => (
                  <th key={ci} className={t.th}>
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td key={ci} className={t.td}>
                    {renderInline(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      )
      continue
    }

    // 无序列表
    if (trimmed.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2))
        i++
      }
      out.push(
        <ul key={key++} className={t.ul}>
          {items.map((it, ii) => (
            <li key={ii} className={t.li}>
              {renderInline(it)}
            </li>
          ))}
        </ul>,
      )
      continue
    }

    // 整行斜体 → 日期/技术栈行
    if (/^\*[^*]+\*$/.test(trimmed)) {
      out.push(
        <span key={key++} className={t.dateSpan}>
          <em>{trimmed.slice(1, -1)}</em>
        </span>,
      )
      i++
      continue
    }

    // 普通段落
    out.push(
      <p key={key++} className={t.p}>
        {renderInline(trimmed)}
      </p>,
    )
    i++
  }

  return out
}
