import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { ResumeData, ThemeId } from '../types'
import { socialAbbr, socialEntries, type SocialEntry } from '../social'
import { MD_THEMES } from '../themes'
import { renderMarkdown } from '../markdown'
import { type LayoutTune } from '../layout'
import { WeChatIcon, XiaohongshuIcon, GithubIcon, WebsiteIcon, PhoneIcon, MailIcon } from './BrandIcons'

interface Props {
  data: ResumeData
  theme: ThemeId
  layout: LayoutTune
}

/**
 * 一条社媒的文案口径：
 * - legacy：公众号 / 小红书 显示「平台名 + 账号」，GitHub 显示完整地址（商务正式、学术经典沿用原样）
 * - tagged：三个平台统一成「平台名 + 账号」，读起来是一组
 * - bare：只显示账号（互联网风的字段表已经有 WX / RED / GH 标签列）
 */
type SocialVariant = 'legacy' | 'tagged' | 'bare'

/** 一条社媒：logo + 文案。有主页的输出 <a>（GitHub / 小红书 / 个人网站），浏览器打印 PDF 时通常会保留成可点链接 */
function SocialItem({ entry, variant = 'legacy' }: { entry: SocialEntry; variant?: SocialVariant }) {
  // 三个 logo 视觉重量对齐：微信气泡本身宽、占面积大，压一点高度；红方块与猫头鹰同尺寸
  const icon =
    entry.kind === 'wechat' ? (
      <WeChatIcon className="shrink-0 w-[0.98em] h-[0.88em] text-[#07C160]" />
    ) : entry.kind === 'xiaohongshu' ? (
      <XiaohongshuIcon className="shrink-0 w-[0.9em] h-[0.9em]" />
    ) : entry.kind === 'website' ? (
      <WebsiteIcon className="shrink-0 w-[0.9em] h-[0.9em] text-ink-2" />
    ) : (
      <GithubIcon className="shrink-0 w-[0.92em] h-[0.92em] text-ink-2" />
    )

  let text
  if (variant === 'bare') {
    text = entry.handle
  } else if (variant === 'tagged') {
    text = (
      <>
        <span className="opacity-60 mr-1">{entry.label}</span>
        {entry.handle}
      </>
    )
  } else {
    text = (
      <>
        {entry.kind !== 'github' && <span className="opacity-60 mr-1">{entry.label}</span>}
        {entry.text}
      </>
    )
  }

  const body = (
    <span className="inline-flex items-center gap-[0.4em]">
      {icon}
      <span>{text}</span>
    </span>
  )

  if (!entry.href) return body
  return (
    <a href={entry.href} target="_blank" rel="noreferrer" className="hover:underline underline-offset-2">
      {body}
    </a>
  )
}

/** 社媒单独占一行：三个平台并排，放不下自动换行，不会有悬空的分隔符 */
function SocialRow({
  socials,
  className,
  variant = 'legacy',
}: {
  socials: SocialEntry[]
  className: string
  variant?: SocialVariant
}) {
  if (!socials.length) return null
  return (
    <div className={className}>
      {socials.map((s) => (
        <SocialItem key={s.kind} entry={s} variant={variant} />
      ))}
    </div>
  )
}

/**
 * 电话 / 邮箱：图标 + 文本，四套主题共用。
 * 细线描边跟社媒的地球图标同一套，缩小到 0.9em 也不抢正文；纸面是矢量，打印不会糊。
 */
function ContactItem({
  icon,
  children,
  textClassName = '',
}: {
  icon: 'phone' | 'mail'
  children: ReactNode
  textClassName?: string
}) {
  const Icon = icon === 'phone' ? PhoneIcon : MailIcon
  return (
    <span className="inline-flex items-center gap-[0.4em]">
      <Icon className="shrink-0 w-[0.9em] h-[0.9em] text-ink-2" />
      <span className={textClassName}>{children}</span>
    </span>
  )
}

/** 简历头部：每个主题的版式与原站一致 */
function ResumeHeader({ data, theme }: Pick<Props, 'data' | 'theme'>) {
  const { name, jobTitle, phone, email, tagline, photo } = data
  const socials = socialEntries(data)

  if (theme === 'minimal') {
    // 极简风格：衬线大名 + 双线抬头（letterpress 的双线压印），靛蓝只标栏目
    return (
      <div className="mb-8">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-[calc(34px*var(--fs,1))] leading-[calc(1.12*var(--lh,1))] tracking-[0.02em] text-ink">
              {name}
            </h1>
            <p className="font-mono text-[calc(11px*var(--fs,1))] uppercase tracking-[0.2em] text-gold-ink mt-3">
              {jobTitle}
            </p>
            {tagline && (
              <p className="font-serif text-[calc(12px*var(--fs,1))] italic text-ink-2 mt-2.5 leading-[calc(1.625*var(--lh,1))]">
                {tagline}
              </p>
            )}
          </div>
          {photo && (
            <img
              src={photo}
              alt="照片"
              className="w-[calc(84px*var(--photo,1))] h-[calc(104px*var(--photo,1))] object-cover border border-rule-strong"
            />
          )}
        </div>

        {/* 双线抬头：上粗下细，中间留白 */}
        <div className="mt-6 border-t-[2.5px] border-ink border-b border-rule-strong pb-3 pt-2.5">
          {/* 元信息带（电话 / 邮箱 / 社媒）统一用无衬线，和衬线大名字拉开一档 */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[calc(11px*var(--fs,1))] text-ink-2">
            {phone && <ContactItem icon="phone">{phone}</ContactItem>}
            {email && <ContactItem icon="mail">{email}</ContactItem>}
          </div>
          <SocialRow
            socials={socials}
            variant="tagged"
            className="mt-2 font-mono text-[calc(11px*var(--fs,1))] text-ink-2 flex flex-wrap items-center gap-x-6 gap-y-1"
          />
        </div>
      </div>
    )
  }

  if (theme === 'business') {
    return (
      <div className="mb-6 pb-4 flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="w-9 h-px bg-gold-ink mb-3" />
          <h1 className="text-[calc(36px*var(--fs,1))] font-bold mb-2 text-biz-navy">{name}</h1>
          <p className="font-mono text-[calc(11.5px*var(--fs,1))] uppercase tracking-[0.18em] text-gold-ink mb-2">
            {jobTitle}
          </p>
          {tagline && <p className="text-[calc(14px*var(--fs,1))] italic text-ink-2 mb-3">{tagline}</p>}
          <div className={`text-[calc(14px*var(--fs,1))] text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1 ${tagline ? '' : 'mt-1.5'}`}>
            <ContactItem icon="phone" textClassName="font-semibold text-ink">
              {phone}
            </ContactItem>
            <span className="text-gold-ink">•</span>
            <ContactItem icon="mail">{email}</ContactItem>
          </div>
          <SocialRow
            socials={socials}
            className="mt-1.5 text-[calc(14px*var(--fs,1))] text-ink-2 flex flex-wrap items-center gap-x-5 gap-y-1"
          />
        </div>
        {photo && (
          <img
            src={photo}
            alt="照片"
            className="w-[calc(128px*var(--photo,1))] h-[calc(160px*var(--photo,1))] object-cover border border-rule-strong"
          />
        )}
      </div>
    )
  }

  if (theme === 'tech') {
    // 互联网风：等宽的字段表，像终端里的参数清单；标签 TEL/MAIL 保留，值前配细线图标
    const fields: { k: string; v: ReactNode }[] = [
      { k: 'TEL', v: phone ? <ContactItem icon="phone">{phone}</ContactItem> : null },
      { k: 'MAIL', v: email ? <ContactItem icon="mail">{email}</ContactItem> : null },
    ].filter((f) => f.v)

    return (
      <div className="mb-7">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="w-9 h-px bg-gold-ink mb-3.5" />
            <h1 className="text-[calc(38px*var(--fs,1))] font-bold leading-[calc(1*var(--lh,1))] tracking-[-0.02em] text-ink">
              {name}
            </h1>
            <p className="font-mono text-[calc(12px*var(--fs,1))] text-gold-ink tracking-[0.1em] mt-3 uppercase">
              {jobTitle}
            </p>
            {tagline && <p className="text-[calc(12.5px*var(--fs,1))] text-ink-2 mt-2 leading-[calc(1.625*var(--lh,1))]">{tagline}</p>}
          </div>
          {photo && (
            <img
              src={photo}
              alt="照片"
              className="w-[calc(84px*var(--photo,1))] h-[calc(84px*var(--photo,1))] object-cover border border-rule-strong"
            />
          )}
        </div>

        {/* 字段表：标签 / 值 两列 */}
        <div className="mt-5 border-t border-ink">
          <div className="grid grid-cols-2 gap-x-8 gap-y-0 pt-2.5 font-mono text-[calc(11px*var(--fs,1))]">
            {fields.map((f) => (
              <div key={f.k} className="flex gap-3 py-[3px] border-b border-rule">
                <span className="text-ink-2 w-11 shrink-0">{f.k}</span>
                <span className="text-ink truncate">{f.v}</span>
              </div>
            ))}
            {socials.map((s) => (
              <div key={s.kind} className="flex gap-3 py-[3px] border-b border-rule">
                <span className="text-ink-2 w-11 shrink-0 uppercase">{socialAbbr(s.kind)}</span>
                <span className="text-ink truncate">
                  <SocialItem entry={s} variant="bare" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // academic：居中的扉页，金线领起，像一份论文的题名页
  return (
    <div className="mb-8 border-b border-rule-strong pb-6 flex items-center gap-6">
      {/* 左侧占位：让文字在照片存在时仍保持视觉居中 */}
      {photo && <div className="w-[calc(112px*var(--photo,1))] shrink-0" />}
      <div className="flex-1 text-center min-w-0">
        <div className="w-10 h-px bg-gold-ink mx-auto mb-3" />
        <h1 className="font-serif text-[calc(36px*var(--fs,1))] font-bold tracking-[0.06em] mb-2.5 text-ink">
          {name}
        </h1>
        <p className="font-mono text-[calc(11px*var(--fs,1))] uppercase tracking-[0.2em] text-gold-ink mb-2">
          {jobTitle}
        </p>
        {tagline && <p className="font-serif text-[calc(13px*var(--fs,1))] italic text-ink-2 mb-3">{tagline}</p>}
        <div className={`text-[calc(14px*var(--fs,1))] text-ink-2 flex justify-center flex-wrap items-center gap-x-6 gap-y-1 ${tagline ? '' : 'mt-1.5'}`}>
          <ContactItem icon="phone">{phone}</ContactItem>
          <ContactItem icon="mail">{email}</ContactItem>
        </div>
        <SocialRow
          socials={socials}
          className="mt-1.5 text-[calc(14px*var(--fs,1))] text-ink-2 flex justify-center flex-wrap items-center gap-x-6 gap-y-1"
        />
      </div>
      {photo && (
        <img
          src={photo}
          alt="照片"
          className="w-[calc(112px*var(--photo,1))] h-[calc(144px*var(--photo,1))] object-cover shrink-0 border border-rule-strong"
        />
      )}
    </div>
  )
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(function ResumePreview(
  { data, theme, layout },
  ref,
) {
  const t = MD_THEMES[theme]
  // 排版微调通过 CSS 变量下发给纸面：字号/行距/照片/页边距倍率驱动 calc，字体用 data-font 挂选择器
  const style = {
    '--fs': layout.fontScale,
    '--lh': layout.lineScale,
    '--photo': layout.photoScale,
    '--pad': layout.marginScale,
  } as CSSProperties
  return (
    <div
      id="resume-preview"
      ref={ref}
      data-font={layout.font}
      style={style}
      className={`a4-paper bg-white ${t.paper}`}
    >
      <ResumeHeader data={data} theme={theme} />
      <div className="relative z-10 markdown-body">{renderMarkdown(data.markdown, t)}</div>
    </div>
  )
})

export default ResumePreview
