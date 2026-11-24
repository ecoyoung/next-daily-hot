/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2025-11-20 14:33:28
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 热榜卡片
 */
'use client'
import { ArrowsRotateRight, CircleCheckFill, CircleXmarkFill } from '@gravity-ui/icons'
import {
  Button,
  Card,
  Chip,
  Description,
  Label,
  ScrollShadow,
  Separator,
  Spinner,
  Tooltip,
} from '@heroui/react'
import { motion, useInView } from 'motion/react'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import BlurFade from '@/components/BlurFade'
import SkeletonCard from '@/components/SkeletonCard'
import { HOT_ITEMS } from '@/enums'
import { API_CACHE_SECONDS, FRESH_HEADER, RESPONSE } from '@/enums/response'
import { useRequest } from '@/hooks/use-request'
import { DOUYIN_BOARD_TABS } from '@/lib/douyin'
import { HONGGUO_BOARD_TABS } from '@/lib/hongguo'
import { WEIBO_BOARD_TABS } from '@/lib/weibo'
import { useAppStore } from '@/store/useAppStore'

import HotListVirtual from './HotListVirtual'

import type { HotListConfig, IResponse } from '@/types'

function HotCard({ value, label, tip, prefix, suffix }: HotListConfig) {
  // 时间线呈现标记（快讯流源）
  const timeline = !!HOT_ITEMS.raw(value)?.timeline
  const setUpdateTime = useAppStore(state => state.setUpdateTime)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  // 更新相对时间
  const relativeText = useAppStore(state =>
    state.getRelativeTime(value),
  )

  // 上次成功更新时间 + 当前时间（分钟级心跳，用于刷新冷却判断）
  const updateTime = useAppStore(state => state.UpdateTime[value])
  const now = useAppStore(state => state.now)
  // 已过分钟数（与"x 分钟前更新"的 fromNow 同源同取整，保证显示自洽）
  const elapsedMin = updateTime ? Math.round((now - updateTime) / 60_000) : 0
  // 剩余分钟 = 缓存窗口 - 已过分钟（两者相加恒等于缓存窗口）
  const remainMin = Math.round(API_CACHE_SECONDS / 60) - elapsedMin
  // 精确冷却判断（毫秒）：冷却结束才恢复可刷新
  // 注意：isCooldown 需在 useRequest 之后基于 error 计算（失败时允许立即重试）
  const cooldownMs = updateTime ? API_CACHE_SECONDS * 1000 - (now - updateTime) : 0

  // 手动刷新时绕过 CDN 缓存（URL 加时间戳），自动加载走缓存
  const bypassCacheRef = useRef(false)
  const noteSourceResult = useAppStore(state => state.noteSourceResult)

  const { data, loading, error, run } = useRequest(
    async () => {
      const fresh = bypassCacheRef.current
      const url = fresh
        ? `/api/${value}?t=${Date.now()}`
        : `/api/${value}`
      // 一次性消费标记
      bypassCacheRef.current = false
      const response = await fetch(url, fresh
        ? { cache: 'no-store', headers: { [FRESH_HEADER]: '1' } }
        : undefined)
      if (response.status !== RESPONSE.SUCCESS) {
        throw new Error('Request failed')
      }
      const result: IResponse = await response.json()
      if (result.code === RESPONSE.ERROR) {
        throw new Error('API returned error')
      }
      const list = result.data || []
      // 空数据视为失败：不写入更新时间（否则会显示"xx 前更新"并触发刷新冷却，导致无法立即重试）
      if (!list.length) {
        throw new Error('API returned empty data')
      }
      // 仅在请求成功且有数据时记录更新时间，失败/空数据时保留旧值
      setUpdateTime({ [value]: Date.now() })
      return list
    },
    {
      manual: true,
      debounceWait: 300,
      retryCount: 3,
    },
  )

  const [board, setBoard] = useState<string>(value === 'weibo' ? 'realtimehot' : value === 'hongguo' ? 'hot' : 'all')
  const boardTabs = useMemo(() => {
    if (value === 'weibo')
      return WEIBO_BOARD_TABS
    const tabs = value === 'douyin'
      ? DOUYIN_BOARD_TABS
      : value === 'hongguo'
        ? HONGGUO_BOARD_TABS
        : null
    if (!tabs)
      return []
    if (!data?.length)
      return tabs.slice(0, 1)
    const present = new Set(data.map(item => item.board).filter(Boolean))
    return tabs.filter(tab => tab.key === 'all' || present.has(tab.key))
  }, [value, data])
  const hasBoardTabs = boardTabs.length > 1
  const filteredData = useMemo(() => {
    if (!hasBoardTabs || board === 'all' || !data)
      return data
    return data.filter(item => item.board === board)
  }, [hasBoardTabs, board, data])

  useEffect(() => {
    if (boardTabs.length && !boardTabs.some(tab => tab.key === board))
      setBoard(boardTabs[0].key)
  }, [board, boardTabs])

  // ✅ 使用 ready 控制自动加载（更可靠）
  // 失败状态强制可刷新：即使 localStorage 残留了上次"假成功"写入的更新时间，
  // error 时也不进入冷却，保证用户能立即重试
  const isCooldown = !error && cooldownMs > 0

  useEffect(() => {
    if (isInView) {
      run()
    }
  }, [isInView, run])

  useEffect(() => {
    if (error)
      noteSourceResult(value, false)
  }, [error, noteSourceResult, value])

  useEffect(() => {
    if (data?.length)
      noteSourceResult(value, true)
  }, [data, noteSourceResult, value])

  // 手动刷新：绕过 CDN 缓存拿最新数据
  const handleRefresh = () => {
    bypassCacheRef.current = true
    run()
  }

  return (
    <Card ref={ref} className="p-0 gap-0">
      <Card.Header className="flex justify-between items-center flex-row p-3">
        <div className="flex items-center gap-2">
          <Image
            alt={`${label}${tip}`}
            height={24}
            src={`/images/${value}.svg`}
            width={24}
            className="rounded-md shrink-0"
          />
          <Label className="font-bold">{label}</Label>
        </div>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <Chip
            color={data?.length ? 'success' : 'danger'}
            size="sm"
            variant="soft"
            className="px-2 py-0.5"
          >
            {loading
              ? (
                  <Spinner size="sm" />
                )
              : data?.length
                ? (
                    <CircleCheckFill width={14} />
                  )
                : (
                    <CircleXmarkFill width={14} />
                  )}
            {hasBoardTabs && board !== 'all' && board !== boardTabs[0]?.key && filteredData?.length
              ? `${filteredData.length} 条`
              : tip}
          </Chip>
        </motion.div>
      </Card.Header>
      <Separator />
      {hasBoardTabs
        ? (
            <>
              <div className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-none">
                {boardTabs.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setBoard(tab.key)}
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs transition-colors ${
                      board === tab.key
                        ? 'bg-foreground text-background'
                        : 'bg-default/40 text-muted hover:bg-default/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Separator />
            </>
          )
        : null}
      <Card.Content className="relative py-0">
        <ScrollShadow hideScrollBar visibility="bottom" className="h-81.75 relative">
          {loading
            ? (
                <SkeletonCard />
              )
            : null}
          {loading
            ? null
            : !filteredData?.length
                ? (
                    <Description className="flex h-full justify-center items-center px-8 text-center leading-5">
                      {data?.length
                        ? '这个分类暂时没有热点'
                        : '抱歉，可能服务器遇到问题了，请稍后重试，或者打开右上角设置关闭热榜显示！🤔'}
                    </Description>
                  )
                : (
                    <BlurFade className="h-full pl-3">
                      <HotListVirtual
                        data={filteredData}
                        prefix={prefix}
                        suffix={suffix}
                        timeline={timeline}
                        value={value}
                      />
                    </BlurFade>
                  )}
        </ScrollShadow>
      </Card.Content>
      <Separator />
      <Card.Footer className="p-3">
        <div className="flex text-center justify-between w-full items-center space-x-4 text-small h-5">
          <Description className="w-1/2">
            {loading
              ? '正在加载中...'
              : error
                ? '更新失败'
                : `${relativeText}获取`}
          </Description>
          <Separator orientation="vertical" className="flex-none" />
          <div className="flex w-1/2 justify-center">
            <Tooltip delay={0}>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={loading}
                isIconOnly
                // 冷却时不禁用按钮（否则 hover 不触发 Tooltip），改为拦截点击 + 视觉淡化
                onPress={isCooldown ? undefined : handleRefresh}
                className={`text-muted${isCooldown ? ' opacity-50' : ''}`}
              >
                {/* Vercel 最佳实践：动画加在包装层而非 SVG 元素上 */}
                <div className={loading ? 'animate-spin' : ''}>
                  <ArrowsRotateRight />
                </div>
              </Button>
              <Tooltip.Content placement="bottom" showArrow>
                <Tooltip.Arrow />
                {isCooldown
                  ? remainMin > 0
                    ? `刚刚获取过，约 ${remainMin} 分钟后可再刷新`
                    : '刚刚获取过，即将可再刷新'
                  : '向源站获取最新'}
              </Tooltip.Content>
            </Tooltip>
          </div>
        </div>
      </Card.Footer>
    </Card>
  )
}

export default HotCard
