/** 平台 Logo：公众号（微信绿）/ 小红书（品牌红）/ GitHub（墨黑）。
 *  单文件离线可用，所以用内联 SVG，不引外链图片。尺寸跟随字号（1em）。 */

interface IconProps {
  className?: string
}

/**
 * 微信双气泡：原图形是 576×512 的横向轮廓，按 1em 宽渲染会显得比方形图标矮一截，
 * 所以宽度按比例给 1.125em，三个 logo 的视觉高度才对得齐。
 */
export function WeChatIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 576 512"
      width="1.125em"
      height="1em"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M385.2 167.6c6.4 0 12.6.3 18.8 1.1C387.4 90.3 303.3 32 207.7 32 100.5 32 13 104.8 13 197.4c0 53.4 29.3 97.5 77.9 131.6l-19.3 58.6 68-34.1c24.4 4.8 43.8 9.7 68.2 9.7 6.2 0 12.1-.3 18.3-.8-4-12.9-6.2-26.6-6.2-40.8-.1-84.9 72.9-154 165.3-154zm-104.5-52.9c14.5 0 24.2 9.7 24.2 24.4 0 14.5-9.7 24.2-24.2 24.2-14.8 0-29.3-9.7-29.3-24.2.1-14.7 14.6-24.4 29.3-24.4zm-136.4 48.6c-14.5 0-29.3-9.7-29.3-24.2 0-14.8 14.8-24.4 29.3-24.4 14.6 0 24.4 9.7 24.4 24.4 0 14.5-9.8 24.2-24.4 24.2zM563 319.4c0-77.9-77.9-141.3-165.4-141.3-92.7 0-165.4 63.4-165.4 141.3S305 460.7 397.6 460.7c19.3 0 38.9-5.1 58.6-9.9l53.4 29.3-14.8-48.6C534 402.1 563 363.2 563 319.4zm-219.1-24.5c-9.7 0-19.3-9.7-19.3-19.6 0-9.7 9.7-19.3 19.3-19.3 14.8 0 24.4 9.7 24.4 19.3 0 10-9.7 19.6-24.4 19.6zm107.1 0c-9.7 0-19.3-9.7-19.3-19.6 0-9.7 9.7-19.3 19.3-19.3 14.5 0 24.4 9.7 24.4 19.3 0 10-9.9 19.6-24.4 19.6z" />
    </svg>
  )
}

/**
 * 小红书：品牌红圆角方块。
 * 官方标志里的白色「小红书」三个字在简历纸面上只有 3–4px，糊成一团反而脏，
 * 所以只留方块本身——平台上标已经说明了它是什么。
 */
export function XiaohongshuIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="24" rx="5.5" fill="#FF2442" />
    </svg>
  )
}

/** 个人网站：地球轮廓，线条和字号走同一套 currentColor，纸面打印也清楚 */
export function WebsiteIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z" />
    </svg>
  )
}

/**
 * 电话 / 邮箱：细线图标，和 WebsiteIcon 同一套 currentColor 描边语言。
 * 左栏编辑区与纸面共用，纸面打印时是矢量线条，不会糊。
 */
export function PhoneIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21.5 16.9v2.6a2 2 0 0 1-2.2 2 17.7 17.7 0 0 1-7.7-2.7 17.4 17.4 0 0 1-5.4-5.4 17.7 17.7 0 0 1-2.7-7.7 2 2 0 0 1 2-2.2h2.6a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1l-1.1 1.1a14 14 0 0 0 5.4 5.4l1.1-1.1a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </svg>
  )
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}

/** GitHub 官方实心猫头鹰标记：与另两个实心色块同一套视觉语言 */
export function GithubIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
