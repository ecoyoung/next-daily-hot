/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-01-05 09:13:12
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 三地翻牌时钟（机场信息板风格）+ 农历
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

/** 时区 → HH:MM:SS（供翻牌组件逐字符翻动） */
function zonedTime(now: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)
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
    <div className="justify-self-center hidden sm:flex flex-col gap-1.5 text-center">
      {/* 三地翻牌时钟（机场信息板风格：琥珀数字 + 深色字块 + 城市码） */}
      <div className="flex items-end justify-center gap-5">
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
          </div>
        ))}
      </div>
      {/* 农历 */}
      <Description>{lunar || '加载农历中...'}</Description>
    </div>
  )
})

export default TimeAndLunar
