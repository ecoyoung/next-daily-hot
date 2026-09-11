/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:21:42
 * @Description: Split Flap 翻牌文字动画
 */
'use client'
import './SplitFlapText.css'

import { useEffect, useRef, useState } from 'react'

const CHARSETS = {
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  numeric: '0123456789',
}

interface SplitFlapTextProps {
  text: string
  /** 翻牌经过的字符集（命名集或自定义字符串） */
  charset?: string
  /** 单次翻牌时长（秒） */
  flipDuration?: number
  /** 相邻字符翻牌错峰（秒） */
  stagger?: number
  /** 每个字符落地前的随机翻动次数 */
  flipsPerChar?: number
  tileColor?: string
  textColor?: string
  tileRadius?: number
  gap?: number
  fontSize?: number
  /** 目标文本含 CJK 字符时加宽字符槽 */
  cjk?: boolean
  className?: string
  style?: React.CSSProperties
  /** 全部字符落定后的回调 */
  onSettled?: () => void
}

interface Tile {
  current: string
  next: string
  flipping: boolean
  tick: number
}

function createTiles(chars: string): Tile[] {
  return chars.split('').map(char => ({ current: char, next: char, flipping: false, tick: 0 }))
}

function resolveCharset(charset: string): string {
  if (charset in CHARSETS)
    return CHARSETS[charset as keyof typeof CHARSETS]
  return charset.length > 0 ? charset : CHARSETS.alphanumeric
}

function sampleChar(charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length)) || ' '
}

function SplitFlapText({
  text,
  charset = 'alphanumeric',
  flipDuration = 0.12,
  stagger = 0.06,
  flipsPerChar = 8,
  tileColor = '#111827',
  textColor = '#f8fafc',
  tileRadius = 8,
  gap = 6,
  fontSize = 52,
  cjk = false,
  className = '',
  style = {},
  onSettled,
}: SplitFlapTextProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const rafRef = useRef<number | null>(null)
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled

  const width = text.length
  // 初始铺随机字符，挂载后翻牌落定到目标文本
  const [tiles, setTiles] = useState<Tile[]>(() =>
    createTiles(Array.from({ length: width }, () => sampleChar(resolveCharset(charset))).join('')))

  useEffect(() => {
    let cancelled = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (prefersReducedMotion) {
      setTiles(createTiles(text))
      onSettledRef.current?.()
      return
    }

    const safeFlipMs = Math.max(40, flipDuration * 1000)
    const safeStaggerMs = Math.max(0, stagger * 1000)
    const safeFlips = Math.max(0, Math.floor(flipsPerChar))
    const activeCharset = resolveCharset(charset)

    // 每个字符一条翻牌计划：随机序列若干步后落定目标字符
    const plans = text
      .split('')
      .map((targetChar, index) => {
        const sequence = Array.from({ length: safeFlips }, () => sampleChar(activeCharset))
        sequence.push(targetChar)
        return {
          index,
          from: tiles[index]?.current ?? ' ',
          target: targetChar,
          sequence,
          start: index * safeStaggerMs,
          step: -1,
          done: false,
        }
      })
      .filter(plan => plan.from !== plan.target)

    if (!plans.length) {
      setTiles(createTiles(text))
      onSettledRef.current?.()
      return
    }

    const updateTiles = (updates: Array<{ index: number, current: string, next: string, done: boolean }>) => {
      setTiles((previous) => {
        const nextTiles = [...previous]
        updates.forEach((update) => {
          const tile = nextTiles[update.index]
          if (!tile)
            return
          nextTiles[update.index] = {
            current: update.current,
            next: update.next,
            flipping: !update.done,
            tick: tile.tick + 1,
          }
        })
        return nextTiles
      })
    }

    const startedAt = performance.now()
    const tick = (now: number) => {
      if (cancelled)
        return
      const elapsed = now - startedAt
      const updates: Array<{ index: number, current: string, next: string, done: boolean }> = []
      let shouldContinue = false

      plans.forEach((plan) => {
        const localElapsed = elapsed - plan.start
        if (localElapsed < 0) {
          shouldContinue = true
          return
        }
        const step = Math.floor(localElapsed / safeFlipMs)
        if (step < plan.sequence.length) {
          shouldContinue = true
          if (step !== plan.step) {
            plan.step = step
            updates.push({
              index: plan.index,
              current: step === 0 ? plan.from : plan.sequence[step - 1],
              next: plan.sequence[step],
              done: false,
            })
          }
        }
        else if (!plan.done) {
          plan.done = true
          updates.push({ index: plan.index, current: plan.target, next: plan.target, done: true })
        }
      })

      if (updates.length > 0)
        updateTiles(updates)

      if (shouldContinue) {
        rafRef.current = requestAnimationFrame(tick)
      }
      else {
        rafRef.current = null
        onSettledRef.current?.()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      if (rafRef.current)
        cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react/exhaustive-deps
  }, [text, prefersReducedMotion])

  const settledText = tiles.map(tile => tile.current).join('').trimEnd()
  const componentStyle = {
    '--split-flap-tile-color': tileColor,
    '--split-flap-text-color': textColor,
    '--split-flap-radius': `${tileRadius}px`,
    '--split-flap-gap': `${gap}px`,
    '--split-flap-font-size': `${fontSize}px`,
    '--split-flap-flip-duration': `${Math.max(0.04, flipDuration)}s`,
    ...style,
  } as React.CSSProperties

  return (
    <div
      aria-label={settledText || undefined}
      role="text"
      className={`split-flap-text ${cjk ? 'split-flap-text--cjk' : ''} ${className}`.trim()}
      style={componentStyle}
    >
      {tiles.map((tile, index) => (
        <span key={`${index}-${tiles.length}`} aria-hidden="true" className="split-flap-text__tile">
          <span className="split-flap-text__half split-flap-text__half--top">
            <span className="split-flap-text__char">{tile.current === ' ' ? '\u00A0' : tile.current}</span>
          </span>
          <span className="split-flap-text__half split-flap-text__half--bottom">
            <span className="split-flap-text__char">{tile.flipping ? tile.next : tile.current}</span>
          </span>

          {tile.flipping && (
            <>
              <span key={`front-${index}-${tile.tick}`} className="split-flap-text__flap split-flap-text__flap--front">
                <span className="split-flap-text__char">{tile.current === ' ' ? '\u00A0' : tile.current}</span>
              </span>
              <span key={`back-${index}-${tile.tick}`} className="split-flap-text__flap split-flap-text__flap--back">
                <span className="split-flap-text__char">{tile.next === ' ' ? '\u00A0' : tile.next}</span>
              </span>
            </>
          )}
        </span>
      ))}
    </div>
  )
}

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia)
      return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReduced(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  return prefersReduced
}

export default SplitFlapText
