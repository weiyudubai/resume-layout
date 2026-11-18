/**
 * 照片处理：选照片时先压到简历用得上的尺寸，再存进 localStorage。
 *
 * 为什么必须压：浏览器给每个站点约 5 MB 的 localStorage 配额，而手机拍一张
 * 照片动辄 3–5 MB，转成 base64 还要再胀三分之一。直接存原图，
 * 一张照片就能把配额吃光——连一份简历都存不下，更别提版本存档
 * （每份存档还会再存一遍照片）。
 *
 * 简历上的照片实际只印 3×4 厘米左右，600px 长边、按 85% 质量输出
 * 大约 30–80 KB，肉眼看不出差别，却比原图小几十倍。
 */

/** 照片长边上限（像素）。超过就等比缩到这一边 */
export const PHOTO_MAX_EDGE = 600
/** 导出 JPEG 的质量 */
export const PHOTO_QUALITY = 0.85
/** 超过这个字节数就算「还是大图」，需要再压（存进存档前也用它把关） */
export const PHOTO_MAX_BYTES = 200 * 1024

/**
 * 等比缩放后的尺寸。纯函数，方便测。
 * 小图不放大——放大只会变大，不会更清楚。
 */
export function targetSize(
  w: number,
  h: number,
  maxEdge: number = PHOTO_MAX_EDGE,
): { w: number; h: number } {
  if (!(w > 0) || !(h > 0)) return { w: 0, h: 0 }
  const longest = Math.max(w, h)
  if (longest <= maxEdge) return { w: Math.round(w), h: Math.round(h) }
  const ratio = maxEdge / longest
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) }
}

/** 这张照片是不是还太大（粗略按字符数算，base64 字符数 ≈ 字节数 × 4/3） */
export function isOversized(
  photo: string | null | undefined,
  limit: number = PHOTO_MAX_BYTES,
): boolean {
  if (!photo) return false
  // data URL 的前缀不算图片本身
  const body = photo.slice(photo.indexOf(',') + 1)
  return body.length > limit
}

/** 估算一张 data URL 的字节数（base64 每 4 个字符还原 3 个字节） */
export function dataUrlBytes(photo: string | null | undefined): number {
  if (!photo) return 0
  const body = photo.slice(photo.indexOf(',') + 1)
  return Math.round((body.length * 3) / 4)
}

/** 读文件成 data URL */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('文件读不出来'))
    reader.readAsDataURL(file)
  })
}

/** 把一张 data URL 画到 canvas 上缩放后重新导出成 JPEG data URL */
export function resizeDataUrl(
  dataUrl: string,
  maxEdge: number = PHOTO_MAX_EDGE,
  quality: number = PHOTO_QUALITY,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const { w, h } = targetSize(img.naturalWidth, img.naturalHeight, maxEdge)
      if (w === 0 || h === 0) {
        reject(new Error('图片尺寸读不出来'))
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('拿不到画布上下文'))
        return
      }
      // 先铺白底：PNG 抠图照片的透明区域，转成 JPEG 后默认会变成黑色
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      try {
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('图片解不开，可能不是浏览器支持的格式'))
    img.src = dataUrl
  })
}

/**
 * 选照片的完整流程：读文件 → 缩放 → 压成 JPEG。
 * 出错时把原始错误抛出去，界面负责提示。
 */
export async function preparePhoto(file: File): Promise<string> {
  const raw = await readFileAsDataUrl(file)
  return resizeDataUrl(raw)
}
