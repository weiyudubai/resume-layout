/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // —— 外壳：两档可切换（深海军蓝 / 暖米），用 CSS 变量驱动 ——
        // 具体数值在 src/index.css 的 :root 与 [data-shell='light'] 里，
        // 这样换外壳只要换一组变量，组件里的类名不用动。
        shell: 'rgb(var(--c-shell) / <alpha-value>)',
        'shell-alt': 'rgb(var(--c-shell-alt) / <alpha-value>)',
        'shell-deep': 'rgb(var(--c-shell-deep) / <alpha-value>)',
        // 前景文字：深色外壳上是暖米字，浅色外壳上是深墨字
        fg: 'rgb(var(--c-fg) / <alpha-value>)',
        'fg-2': 'rgb(var(--c-fg-2) / <alpha-value>)',
        'fg-3': 'rgb(var(--c-fg-3) / <alpha-value>)',
        // 分隔线
        edge: 'rgb(var(--c-edge) / <alpha-value>)',
        // 强调色：深色外壳上是古金，浅色外壳上是压暗的古金（保证对比）
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        // 告警色：只出现在「超出」与「操作提示」上，不参与装饰
        alert: 'rgb(var(--c-alert) / <alpha-value>)',
        // —— 纸面：固定不变。纸始终是白纸黑字，保证打印投 HR 时不跑色 ——
        ink: {
          DEFAULT: '#1a2030',
          2: '#5a6270',
          3: '#8a90a0',
        },
        rule: {
          DEFAULT: '#e3ddd0',
          strong: '#cac4b4',
        },
        // 白纸上的古金要压暗才读得清（#7d6130 在白底上约 4.9:1）
        'gold-ink': '#7d6130',
        // 商务正式模板的页眉色：Signal 的深海军蓝
        'biz-navy': '#1c2644',
        'creative-accent': '#8b5cf6',
      },
      fontFamily: {
        // Georgia 只管拉丁字母，中文自动落到宋体
        serif: ['Georgia', '"Times New Roman"', '"Songti SC"', 'STSong', 'serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
