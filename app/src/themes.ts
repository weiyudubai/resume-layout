import type { ThemeId } from './types'

/** 每个主题下 Markdown 各元素的样式（与原站逐一对应） */
export interface MdTheme {
  paper: string
  h2: string
  h3: string
  dateSpan: string
  ul: string
  li: string
  p: string
  table: string
  th: string
  td: string
  hr: string
  /** 创意设计主题：h2 标题下方的高亮笔刷 */
  h2Highlight?: boolean
  /** 分节是否带中文序号（学术经典用） */
  numbered?: boolean
}

/**
 * 纸面样式：Signal Theme 的「浅色版」——
 * 深墨正文（#1a2030）、古金标题（#8a6c34，白纸上要读得清）、
 * 米灰分隔线（#cac4b4），纸本身始终留白，保证打印投 HR 是白纸黑字。
 */
export const MD_THEMES: Record<ThemeId, MdTheme> = {
  // 极简风格：衬线正文 + 古金短线分节，像一册排得很松的小书
  minimal: {
    paper: 'p-[calc(48px*var(--pad,1))] font-serif text-ink',
    h2: 'mt-9 mb-4 font-mono text-[calc(15px*var(--fs,1))] uppercase tracking-[0.22em] text-gold-ink flex items-center gap-3 before:content-[""] before:w-9 before:h-px before:bg-gold-ink before:shrink-0',
    h3: 'text-[calc(15px*var(--fs,1))] font-bold text-ink mt-5 mb-1',
    dateSpan: 'font-mono text-[calc(10.5px*var(--fs,1))] tracking-[0.04em] italic text-ink-2 block mb-1.5',
    ul: 'list-none space-y-[3px] mb-4',
    li: 'text-[calc(12.5px*var(--fs,1))] leading-[calc(1.9*var(--lh,1))] text-[#3a4050] relative pl-4 before:content-["—"] before:absolute before:left-0 before:text-gold-ink',
    p: 'text-[calc(12.5px*var(--fs,1))] leading-[calc(1.9*var(--lh,1))] text-[#3a4050] mb-2 text-justify',
    table: 'w-full text-[calc(11.5px*var(--fs,1))] border-collapse mb-4',
    th: 'border-b border-ink/70 px-2 py-1.5 font-bold text-left text-ink',
    td: 'border-b border-rule px-2 py-1.5 text-[#3a4050]',
    hr: 'border-rule-strong my-6',
  },
  // 商务正式：深海军蓝页眉 + 古金短线，像一份战略咨询报告的章节页
  business: {
    paper: 'p-[calc(40px*var(--pad,1))] serif-digits text-ink leading-[calc(1.375*var(--lh,1))]',
    h2: 'mt-8 mb-4 pb-2.5 border-b border-rule-strong font-mono text-[calc(16px*var(--fs,1))] font-medium uppercase tracking-[0.18em] text-biz-navy flex items-center gap-3 before:content-[""] before:w-9 before:h-px before:bg-gold-ink before:shrink-0',
    h3: 'text-[calc(14.5px*var(--fs,1))] font-bold text-ink mt-4',
    dateSpan: 'text-[calc(13px*var(--fs,1))] text-ink-2 mb-1 block italic',
    ul: 'list-disc ml-5 space-y-1 mb-3 marker:text-gold-ink',
    li: 'text-[calc(13.5px*var(--fs,1))] text-[#3a4050] pl-1',
    p: 'text-[calc(13.5px*var(--fs,1))] text-[#3a4050] mb-2 text-justify',
    table: 'w-full text-[calc(13px*var(--fs,1))] border-collapse mb-4',
    th: 'border border-rule-strong p-2 bg-[#f7f4ec] font-bold text-left text-ink',
    td: 'border border-rule-strong p-2',
    hr: 'border-rule-strong my-6',
  },
  // 互联网风：等宽元信息 + 古金标记，像一份终端里的参数清单
  tech: {
    paper: 'p-[calc(40px*var(--pad,1))] font-sans text-ink',
    h2: 'mt-8 mb-3.5 font-mono text-[calc(14.5px*var(--fs,1))] font-medium uppercase tracking-[0.18em] text-gold-ink flex items-center gap-2.5 before:content-[""] before:w-[3px] before:h-[1.05em] before:bg-gold-ink before:shrink-0',
    h3: 'text-[calc(13.5px*var(--fs,1))] font-bold text-ink mt-5 mb-1',
    dateSpan: 'font-mono text-[calc(10.5px*var(--fs,1))] tracking-[0.04em] text-ink-2 mb-2 block',
    ul: 'list-none space-y-1 mb-4',
    li: 'text-[calc(12px*var(--fs,1))] leading-[calc(1.78*var(--lh,1))] text-[#3a4050] relative pl-4 before:content-["▸"] before:absolute before:left-0 before:top-[1px] before:text-[calc(9px*var(--fs,1))] before:text-gold-ink',
    p: 'text-[calc(12px*var(--fs,1))] leading-[calc(1.78*var(--lh,1))] text-[#3a4050] mb-2',
    table: 'w-full text-[calc(11.5px*var(--fs,1))] border-collapse mb-4',
    th: 'border-b border-ink/70 px-2 py-1.5 font-mono font-bold text-left text-ink',
    td: 'border-b border-rule px-2 py-1.5 text-[#3a4050]',
    hr: 'border-rule my-6',
  },
  // 学术经典：居中章节名 + 两侧发丝线，像一份论文目录页
  academic: {
    paper: 'p-[calc(48px*var(--pad,1))] serif-digits text-ink',
    numbered: true,
    h2: 'mt-9 mb-4 font-mono text-[calc(15.5px*var(--fs,1))] font-medium uppercase tracking-[0.18em] text-ink flex items-center gap-3 before:content-[""] before:flex-1 before:h-px before:bg-rule-strong after:content-[""] after:flex-1 after:h-px after:bg-rule-strong',
    h3: 'text-[calc(14.5px*var(--fs,1))] font-bold text-ink mt-4',
    dateSpan: 'text-[calc(13px*var(--fs,1))] text-ink-2 italic mb-1 block',
    ul: 'list-disc ml-5 space-y-1 mb-3 marker:text-gold-ink',
    li: 'text-[calc(13.5px*var(--fs,1))] text-[#3a4050] pl-1',
    p: 'text-[calc(13.5px*var(--fs,1))] text-[#3a4050] mb-2 leading-[calc(1.625*var(--lh,1))] text-justify',
    table: 'w-full text-[calc(13px*var(--fs,1))] border-collapse mb-4',
    th: 'border border-rule-strong p-2 bg-[#f7f4ec] font-bold text-left text-ink',
    td: 'border border-rule-strong p-2',
    hr: 'border-rule-strong my-6',
  },
}
