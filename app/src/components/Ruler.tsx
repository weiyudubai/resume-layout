interface Props {
  /** 预览缩放比例 */
  scale: number
  /** 纸面当前高度（未缩放，px） */
  paperH: number
  /** 内容实际高度（未缩放，px） */
  contentH: number
  /** 一页 A4 的像素高度 */
  pagePx: number
}

/**
 * 页尺：贴在纸面左侧的刻度。
 * 纸面本身会长到内容高度，尺子把「一页到哪里」直接标出来，
 * 内容超过一页时，超出那段用警示色画出来。
 */
export default function Ruler({ scale, paperH, contentH, pagePx }: Props) {
  const h = paperH * scale
  const pageH = pagePx * scale
  const fit = contentH / pagePx
  const overflow = contentH > pagePx + 1
  const contentY = Math.min(contentH * scale, h)

  const pageCount = Math.max(1, Math.ceil(paperH / pagePx))
  const ticks: { y: number; label: string; major: boolean }[] = []
  for (let p = 0; p < pageCount; p++) {
    const base = p * pageH
    const marks: { q: number; label: string }[] =
      p === 0
        ? [
            { q: 0, label: '0' },
            { q: 0.25, label: '25%' },
            { q: 0.5, label: '50%' },
            { q: 0.75, label: '75%' },
            { q: 1, label: '1 页' },
          ]
        : [{ q: 1, label: `${p + 1} 页` }]
    for (const m of marks) {
      const y = base + m.q * pageH
      if (y <= h + 1) ticks.push({ y, label: m.label, major: m.q === 0 || m.q === 1 })
    }
  }

  return (
    <div className="stage-ruler relative w-[46px] shrink-0" style={{ height: h }} aria-hidden>
      {/* 尺脊 */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-edge" />

      {/* 内容线：一页内是古金，超出一页的部分是警示色 */}
      <div
        className="absolute right-0 w-px bg-gold"
        style={{ top: 0, height: Math.min(contentY, pageH) }}
      />
      {overflow && (
        <div
          className="absolute right-0 w-px bg-alert"
          style={{ top: pageH, height: contentY - pageH }}
        />
      )}

      {ticks.map((t) => (
        <div
          key={`${t.label}-${t.y}`}
          className="absolute right-0 flex items-center justify-end gap-1.5 -translate-y-1/2"
          style={{ top: t.y }}
        >
          <span className={`font-mono text-[11px] ${t.major ? 'text-fg-2' : 'text-fg-3'}`}>
            {t.label}
          </span>
          <span className={`h-px ${t.major ? 'w-2.5 bg-fg-3' : 'w-1.5 bg-fg-3/50'}`} />
        </div>
      ))}

      {/* 内容结束位置 */}
      <div
        className="absolute right-0 flex items-center justify-end gap-1.5 -translate-y-1/2"
        style={{ top: contentY }}
      >
        <span className={`font-mono text-[11px] ${overflow ? 'text-alert' : 'text-fg-2'}`}>
          {fit.toFixed(2)}
        </span>
        <span className={`h-px w-2.5 ${overflow ? 'bg-alert' : 'bg-fg-3'}`} />
      </div>
    </div>
  )
}
