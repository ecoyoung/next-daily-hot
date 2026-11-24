/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-11-24 10:40:00
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-24 10:40:00
 * @Description: 把「3分钟前」这类相对时间换成北京时间，避免缓存后文案继续变旧
 */

export interface AbsoluteTime {
  /** MM-DD HH:mm */
  tip: string
  ts: number
}

/** 北京时间 MM-DD HH:mm */
export function formatShanghai(ts: number): string {
  const shifted = new Date(ts + 8 * 60 * 60 * 1000)
  const iso = shifted.toISOString()
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`
}

/**
 * 解析中文相对时间。调用方需要在拿到页面的当下计算，
 * 所以这些源的上游请求应走 cache: 'no-store'。
 */
export function parseRelativeTime(text: string, now = Date.now()): AbsoluteTime | undefined {
  const trimmed = text.replace(/\s+/g, '')
  if (!trimmed)
    return undefined
  if (trimmed === '刚刚')
    return { tip: formatShanghai(now), ts: now }

  const relative = trimmed.match(/(\d+)(分钟|小时|天)前/)
  if (relative) {
    const amount = Number(relative[1])
    const unit = relative[2]
    const delta = unit === '分钟'
      ? amount * 60_000
      : unit === '小时'
        ? amount * 3_600_000
        : amount * 86_400_000
    const ts = now - delta
    return { tip: formatShanghai(ts), ts }
  }

  const clock = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (clock) {
    const shifted = new Date(now + 8 * 60 * 60 * 1000)
    const isoDay = shifted.toISOString().slice(0, 10)
    const hh = clock[1].padStart(2, '0')
    const ts = Date.parse(`${isoDay}T${hh}:${clock[2]}:00+08:00`)
    return { tip: formatShanghai(ts), ts }
  }

  const monthDay = trimmed.match(/^(\d{1,2})月(\d{1,2})日/)
  if (monthDay) {
    const year = new Date(now + 8 * 60 * 60 * 1000).getUTCFullYear()
    const ts = Date.parse(`${year}-${monthDay[1].padStart(2, '0')}-${monthDay[2].padStart(2, '0')}T00:00:00+08:00`)
    return { tip: `${monthDay[1].padStart(2, '0')}-${monthDay[2].padStart(2, '0')}`, ts }
  }

  return undefined
}
