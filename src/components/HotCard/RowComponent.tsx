/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2026-01-12 15:12:53
 * @LastEditors: 白雾茫茫丶<baiwumm.com>
 * @LastEditTime: 2026-07-31 17:33:53
 * @Description: 动态列表子项
 */
import { Description } from '@heroui/react'
import { memo, useMemo } from 'react'

import OverflowDetector from '@/components/OverflowDetector'
import { formatNumber, hotLableColor, hotTagColor } from '@/lib/utils'

import type { HotValue } from '@/enums'
import type { HotListItem } from '@/types'
import type { ReactNode } from 'react'

interface RowData {
  index: number
  data: HotListItem[]
  value: HotValue
  prefix?: ReactNode
  suffix?: ReactNode
  /** 时间线呈现（快讯流源）：轴线 + 节点 + 时间，不显示榜单序号 */
  timeline?: boolean
}

function HotDisplay({
  value,
  prefix,
  suffix,
}: {
  value: string | number
  prefix?: ReactNode
  suffix?: ReactNode
}) {
  return (
    <Description className="shrink-0 flex items-center gap-0.5">
      {prefix}
      {value}
      {suffix}
    </Description>
  )
}

// Vercel 最佳实践：虚拟列表行组件用 memo，避免滚动/数据更新时无关行重渲染
const RowComponent = memo(({ index, data, value, prefix, suffix, timeline }: RowData) => {
  const item = useMemo(() => data[index], [data, index])
  const { label } = item

  const colorStyle = useMemo(() => {
    const bgColor = hotTagColor[index] || 'var(--default)'
    const textColor = hotTagColor[index] ? '#fff' : 'var(--default-foreground)'
    return { backgroundColor: bgColor, color: textColor }
  }, [index])

  // 标签行内小chip配色：微博爆点色系优先，其余用默认色
  const tagStyle = useMemo(() => {
    const bgColor = label ? (hotLableColor[label as keyof typeof hotLableColor] || 'var(--default)') : null
    if (!bgColor)
      return null
    return { backgroundColor: bgColor, color: hotLableColor[label as keyof typeof hotLableColor] ? '#fff' : 'var(--default-foreground)' }
  }, [label])

  // Vercel 最佳实践：primitive 派生值无需 useMemo 缓存
  const displayText = index + 1

  const endContent = useMemo(() => {
    if (timeline)
      return null
    if (item.hot) {
      return <HotDisplay value={formatNumber(item.hot)} />
    }
    if (item.tip) {
      return <HotDisplay prefix={prefix} suffix={suffix} value={item.tip} />
    }
    return null
  }, [item.hot, item.tip, prefix, suffix, timeline])

  // 时间线行：贯穿轴线 + 节点圆点 + 时间标签（发布时间流，无序号语义）
  if (timeline) {
    return (
      <div className="flex group items-center gap-1 min-w-0 py-1.5 w-full border-b border-default">
        {/* 轴线段：上下贯穿（行高撑满），首行上段隐藏由外层溢出裁切自然处理 */}
        <div className="relative mx-2 h-full self-stretch w-px shrink-0 bg-default">
          <span className="absolute left-1/2 top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary group-hover:bg-primary" />
        </div>
        <Description className="shrink-0 w-[3.6rem] text-xs tabular-nums leading-none">
          {item.tip || ''}
        </Description>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <OverflowDetector type={value} record={item} />
          {label
            ? (
                <span
                  className="shrink-0 rounded px-1 py-0.5 text-[10px] leading-none whitespace-nowrap"
                  style={tagStyle ?? undefined}
                >
                  {label.slice(0, 6)}
                </span>
              )
            : null}
        </div>
        {item.hot ? <HotDisplay value={item.hot} /> : null}
      </div>
    )
  }

  return (
    <div className="flex group justify-between items-center gap-1 min-w-0 py-1.5 w-full border-b border-default">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className="text-xs size-6 rounded shrink-0 flex items-center justify-center"
          style={colorStyle}
        >
          {displayText}
        </div>
        {label
          ? (
              <span
                className="shrink-0 rounded px-1 py-0.5 text-[10px] leading-none whitespace-nowrap"
                style={tagStyle ?? undefined}
              >
                {label.slice(0, 6)}
              </span>
            )
          : null}
        <OverflowDetector type={value} record={item} />
      </div>
      {endContent}
    </div>
  )
})

export default RowComponent
