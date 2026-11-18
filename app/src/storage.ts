/**
 * 安全的持久化层。
 * 优先使用 localStorage（普通浏览器环境）；
 * 看板 Widget 运行在禁用了 localStorage 的沙箱 iframe 里，
 * 此时自动降级到 Widget 运行时提供的 saveInput / inputState 持久化。
 */

interface DaimonWidgetApi {
  inputState?: { currentInput?: Record<string, unknown> }
  saveInput?: (input: Record<string, unknown>) => void
}

function daimonWidget(): DaimonWidgetApi | undefined {
  try {
    return (window as unknown as { DaimonWidget?: DaimonWidgetApi }).DaimonWidget
  } catch {
    return undefined
  }
}

export function loadJSON(key: string): string | null {
  try {
    const v = localStorage.getItem(key)
    if (v !== null && v !== undefined) return v
  } catch {
    /* 沙箱：localStorage 不可用 */
  }
  try {
    const v = daimonWidget()?.inputState?.currentInput?.[key]
    return typeof v === 'string' ? v : null
  } catch {
    return null
  }
}

/**
 * 与 saveJSON 相同，但会如实返回「到底写进去没有」。
 * 版本存档动辄占几百 KB，写超 localStorage 配额时需要提示用户先导出再删，
 * 不能像 saveJSON 那样把失败悄悄咽掉。
 */
export function saveJSONOk(key: string, value: string): boolean {
  const widget = daimonWidget()
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    /* 配额超限或沙箱环境，交给下面的宿主接口兜底 */
  }
  try {
    if (widget?.saveInput) {
      widget.saveInput({ [key]: value })
      return true
    }
  } catch {
    /* 宿主不支持时算失败 */
  }
  return false
}

export function saveJSON(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 沙箱：忽略 */
  }
  try {
    daimonWidget()?.saveInput?.({ [key]: value })
  } catch {
    /* 宿主不支持时忽略 */
  }
}
