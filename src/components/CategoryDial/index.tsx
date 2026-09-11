/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:21:42
 * @Description: 罗盘分类选择器（圆环表冠式循环旋钮）
 */
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useRef } from 'react'

import { HOT_ITEMS } from '@/enums'
import { CATEGORY_ORDER, isInCategory } from '@/enums/categories'
import { useAppStore } from '@/store/useAppStore'

import type { CategoryItem } from '@/enums/categories'

/** 灯光高亮辉光（与站点罗盘 logo 同色系） */
const GLOW_STYLE = {
  boxShadow: '0 0 0 1px rgba(23, 88, 169, 0.5), 0 0 18px rgba(23, 88, 169, 0.45)',
} as const

function CategoryDial() {
  const category = useAppStore(state => state.category)
  const setCategory = useAppStore(state => state.setCategory)

  const N = CATEGORY_ORDER.length
  const idx = Math.max(0, CATEGORY_ORDER.findIndex(c => c.key === category))
  const current = CATEGORY_ORDER[idx]
  const prev = CATEGORY_ORDER[(idx - 1 + N) % N]
  const next = CATEGORY_ORDER[(idx + 1) % N]
  const count = HOT_ITEMS.values.filter(v => isInCategory(v, current.key)).length

  // 旋转方向（驱动位移动画）
  const dirRef = useRef(1)
  const step = useCallback((delta: 1 | -1) => {
    dirRef.current = delta
    setCategory(CATEGORY_ORDER[(idx + delta + N) % N].key)
  }, [idx, N, setCategory])

  // 滚轮节流：一次滚动手势只步进一格
  const wheelAccRef = useRef(0)
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    wheelAccRef.current += e.deltaY
    if (Math.abs(wheelAccRef.current) >= 40) {
      step(wheelAccRef.current > 0 ? 1 : -1)
      wheelAccRef.current = 0
    }
  }, [step])

  // 上下拖拽：位移超过阈值步进一格
  const dragYRef = useRef<number | null>(null)

  return (
    <div
      onPointerDown={e => (dragYRef.current = e.clientY)}
      onPointerUp={(e) => {
        const start = dragYRef.current
        dragYRef.current = null
        if (start == null)
          return
        const dy = e.clientY - start
        if (Math.abs(dy) >= 24)
          step(dy > 0 ? 1 : -1)
      }}
      onWheel={onWheel}
      className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 select-none"
    >
      <div
        title="滚动或拖拽旋转罗盘"
        className="relative flex size-32 items-center justify-center rounded-full border border-default bg-surface/70 shadow-soft backdrop-blur-md"
      >
        <TickRing />
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-between px-3 py-4">
          <AnimatePresence initial={false} mode="popLayout">
            <DimSlot key={`prev-${prev.key}`} delta={-1} item={prev} onSelect={step} />
          </AnimatePresence>

          <AnimatePresence initial={false} mode="popLayout">
            <CurrentSlot key={`cur-${current.key}`} count={count} dir={dirRef.current} item={current} />
          </AnimatePresence>

          <AnimatePresence initial={false} mode="popLayout">
            <DimSlot key={`next-${next.key}`} delta={1} item={next} onSelect={step} />
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/** 当前选中项（灯光高亮） */
function CurrentSlot({ count, dir, item }: { count: number, dir: number, item: CategoryItem }) {
  return (
    <motion.button
      aria-label={`当前分类：${item.label}`}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: dir * -18, scale: 0.7 }}
      initial={{ opacity: 0, y: dir * 18, scale: 0.7 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="flex shrink-0 cursor-default flex-col items-center gap-0.5 rounded-full bg-primary/10 px-3 py-1.5"
      style={GLOW_STYLE}
    >
      <span className="text-xs font-bold leading-none whitespace-nowrap">{item.label}</span>
      <span className="text-[9px] leading-none text-muted">
        {count}
        {' '}
        源
      </span>
    </motion.button>
  )
}

/** 相邻暗淡项（可点击旋转） */
function DimSlot({ delta, item, onSelect }: { delta: 1 | -1, item: CategoryItem, onSelect: (delta: 1 | -1) => void }) {
  return (
    <motion.button
      aria-label={`切换到${item.label}`}
      animate={{ opacity: 0.45, y: 0, scale: 0.85 }}
      exit={{ opacity: 0, y: delta * -12, scale: 0.7 }}
      initial={{ opacity: 0, y: delta * 12, scale: 0.7 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ opacity: 0.95 }}
      onClick={() => onSelect(delta)}
      className="shrink-0 cursor-pointer px-1 text-[10px] leading-none whitespace-nowrap"
    >
      {item.label}
    </motion.button>
  )
}

/** 刻度环：12 格，正四向为主刻度 */
function TickRing() {
  return (
    <div className="pointer-events-none absolute inset-1.5 rounded-full">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div
            className={`absolute left-1/2 top-0 w-px -translate-x-1/2 rounded-full bg-default-foreground/30 ${i % 3 === 0 ? 'h-2' : 'h-1'}`}
          />
        </div>
      ))}
    </div>
  )
}

export default CategoryDial
