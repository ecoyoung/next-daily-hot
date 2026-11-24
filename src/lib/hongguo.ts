/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-11-23 19:20:00
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-23 19:20:00
 * @Description: 红果短剧官方热播榜（公开榜单页，榜单划分对齐 drama-radar）
 */

import * as cheerio from 'cheerio'

import type { HotListItem } from '@/types'

export const HONGGUO_BASE = 'https://hongguoduanju.com'

/** 卡片内筛选 key（与官网四个热播榜对应） */
export type HongguoBoardKey = 'hot' | 'real' | 'ai' | 'comic'

export interface HongguoBoardTab {
  key: HongguoBoardKey
  label: string
  /** 官网路径片段，如 hot-drama */
  slug: string
}

/** 官网四个热播榜：综合 / 真人 / AI / 漫剧 */
export const HONGGUO_BOARD_TABS: HongguoBoardTab[] = [
  { key: 'hot', label: '热播', slug: 'hot-drama' },
  { key: 'real', label: '真人', slug: 'hot-real-drama' },
  { key: 'ai', label: 'AI剧', slug: 'hot-ai-drama' },
  { key: 'comic', label: '漫剧', slug: 'hot-comic-drama' },
]

export function hongguoRankUrl(slug: string, page: number): string {
  const path = `${HONGGUO_BASE}/rank/${slug}`
  return page > 1 ? `${path}?page=${page}` : path
}

export function hongguoDetailUrl(seriesId: string): string {
  return `${HONGGUO_BASE}/detail?series_id=${seriesId}`
}

/** 「9096万热度」「1.2亿热度」→ 整数热度 */
export function parseHongguoHeat(text: string): number | undefined {
  const match = text.replace(/\s+/g, '').match(/(\d+(?:\.\d+)?)(万|亿)?热度/)
  if (!match)
    return undefined
  const value = Number(match[1])
  if (!Number.isFinite(value))
    return undefined
  if (match[2] === '亿')
    return Math.round(value * 1e8)
  if (match[2] === '万')
    return Math.round(value * 1e4)
  return Math.round(value)
}

/** 榜单状态角标：新剧 / 爆剧 → 卡片已有配色的短标签 */
function statusMark(status?: string): string | undefined {
  if (!status)
    return undefined
  if (status.includes('爆'))
    return '爆'
  if (status.includes('新'))
    return '新'
  if (status.includes('热'))
    return '热'
  return status.slice(0, 2)
}

/**
 * 解析一页官方榜单 HTML。
 * 类名带随机后缀，只认 aria / id 和稳定的类名前缀。
 */
export function parseHongguoRankPage(html: string, board: HongguoBoardKey): HotListItem[] {
  const $ = cheerio.load(html)
  const result: HotListItem[] = []

  $('article[aria-labelledby^="rank-title-"]').each((_, el) => {
    const article = $(el)
    const seriesId = (article.attr('aria-labelledby') ?? '').slice('rank-title-'.length)
    if (!/^\d{6,}$/.test(seriesId))
      return

    const title = article.find('h2').first().text().replace(/\s+/g, ' ').trim()
    if (!title)
      return

    const plain = article.text().replace(/\s+/g, '')
    const categories = article.find('p[class*="categor"]').first().text().replace(/\s+/g, ' ').trim()
    const synopsis = article.find('p[class*="description"]').first().text().replace(/\s+/g, ' ').trim()
    const status = article.find('ul[aria-label="作品互动数据"] li')
      .toArray()
      .map(li => $(li).text().replace(/\s+/g, ''))
      .find(text => text && !/\d/.test(text))
    const score = plain.match(/(\d+(?:\.\d+)?)分/)?.[1]
    const url = hongguoDetailUrl(seriesId)
    const pic = article.find('img').attr('src')
    const desc = [score ? `${score}分` : '', categories, synopsis].filter(Boolean).join(' · ')

    result.push({
      id: `${board}:${seriesId}`,
      title,
      desc: desc || undefined,
      hot: parseHongguoHeat(plain),
      label: statusMark(status),
      url,
      mobileUrl: url,
      pic: pic || undefined,
      board,
    })
  })

  return result
}
