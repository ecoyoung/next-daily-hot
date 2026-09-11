/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-01-05 09:13:12
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 三地时钟（北京/加州/伦敦）+ 农历
 */
import { Description } from '@heroui/react'
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'
import { memo, useEffect, useState } from 'react'

import type { FC } from 'react'

const ZONES = [
  { label: '北京', tz: 'Asia/Shanghai' },
  { label: '加州', tz: 'America/Los_Angeles' },
  { label: '伦敦', tz: 'Europe/London' },
]

/** 按时区拆解时分秒（数字值，供 NumberFlow 滚动动画） */
function zonedParts(now: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(now)
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0)
  return { h: get('hour') % 24, m: get('minute'), s: get('second') }
}

const TimeAndLunar: FC = memo(() => {
  const [now, setNow] = useState(() => new Date())
  const [lunar, setLunar] = useState('')

  useEffect(() => {
    let lastDate = ''
    let lastSecond = ''
    let cancelled = false

    const update = () => {
      const current = new Date()

      // 仅当秒数变化时才更新，避免 60fps 重渲染
      const secondKey = `${current.getSeconds()}`
      if (secondKey !== lastSecond) {
        lastSecond = secondKey
        setNow(current)
      }

      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
      if (dateStr !== lastDate) {
        lastDate = dateStr

        // Vercel 最佳实践：lunar-typescript 按需加载，不进入首屏 bundle
        void import('lunar-typescript').then(({ Lunar }) => {
          if (cancelled)
            return

          const l = Lunar.fromDate(current)
          setLunar(
            `${l.getYearInGanZhi()}年 ${l.getMonthInGanZhi()}月 ${l.getDayInGanZhi()}日 ${l.getMonthInChinese()}月${l.getDayInChinese()} 星期${l.getWeekInChinese()}`,
          )
        })
      }
    }

    // 首次由 rAF 异步触发（避免 effect 中同步 setState），之后每秒刷新
    const frame = requestAnimationFrame(update)
    const timer = setInterval(update, 1000)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="justify-self-center hidden sm:flex flex-col gap-1 text-center">
      {/* 三地时钟（数字流滚动） */}
      <div className="flex items-center justify-center gap-4">
        {ZONES.map((zone, i) => {
          const { h, m, s } = zonedParts(now, zone.tz)
          return (
            <div key={zone.tz} className="flex items-center gap-2">
              {i > 0 && <span className="text-default-foreground/20">|</span>}
              <Description className="text-xs">{zone.label}</Description>
              <NumberFlowGroup>
                <div className="flex items-center text-sm tabular-nums">
                  <NumberFlow format={{ minimumIntegerDigits: 2 }} value={h} />
                  <NumberFlow format={{ minimumIntegerDigits: 2 }} prefix=":" value={m} />
                  <NumberFlow format={{ minimumIntegerDigits: 2 }} prefix=":" value={s} />
                </div>
              </NumberFlowGroup>
            </div>
          )
        })}
      </div>
      {/* 农历 */}
      <Description>{lunar || '加载农历中...'}</Description>
    </div>
  )
})

export default TimeAndLunar
