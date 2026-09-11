/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-01-05 09:13:12
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 三地翻牌时钟（机场信息板风格）+ 当地公历日期与 UTC 偏移
 */
import { Description } from '@heroui/react'
import { memo, useEffect, useState } from 'react'

import SplitFlapText from '@/components/SplitFlapText/SplitFlapText'

import type { FC } from 'react'

const ZONES = [
  { code: 'BJ', label: '北京', tz: 'Asia/Shanghai' },
  { code: 'SF', label: '加州', tz: 'America/Los_Angeles' },
  { code: 'LDN', label: '伦敦', tz: 'Europe/London' },
]

/** 时区 → UTC 偏移标签（UTC+8 / UTC-7 / UTC+0） */
function utcOffset(now: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(now)
  const name = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0'
  return name.replace('GMT', 'UTC')
}

/** 时区 → 当地公历日期 YYYY-MM-DD */
function zonedDate(now: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** 时区 → HH:MM:SS（供翻牌组件逐字符翻动） */
function zonedTime(now: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)
}

const TimeAndLunar: FC = memo(() => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let lastSecond = ''

    const update = () => {
      const current = new Date()
      // 仅当秒数变化时才更新，避免 60fps 重渲染
      const secondKey = `${current.getSeconds()}`
      if (secondKey !== lastSecond) {
        lastSecond = secondKey
        setNow(current)
      }
    }

    // 首次由 rAF 异步触发（避免 effect 中同步 setState），之后每秒刷新
    const frame = requestAnimationFrame(update)
    const timer = setInterval(update, 1000)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="justify-self-center hidden sm:flex flex-col gap-1 text-center">
      {/* 三地翻牌时钟：城市码 + 翻牌时间 + 当地日期/UTC 偏移 */}
      <div className="flex items-start justify-center gap-5">
        {ZONES.map(zone => (
          <div key={zone.tz} className="flex flex-col items-center gap-1">
            <Description className="text-[9px] tracking-[0.25em] text-muted">
              {zone.code}
              {' '}
              {zone.label}
            </Description>
            <SplitFlapText
              charset="numeric"
              flipDuration={0.09}
              flipsPerChar={2}
              fontSize={20}
              gap={2}
              stagger={0}
              text={zonedTime(now, zone.tz)}
              textColor="#fbbf24"
              tileColor="#1c1c1e"
              tileRadius={3}
            />
            <Description className="text-[9px] tabular-nums text-muted">
              {zonedDate(now, zone.tz)}
              {' · '}
              {utcOffset(now, zone.tz)}
            </Description>
          </div>
        ))}
      </div>
    </div>
  )
})

export default TimeAndLunar
