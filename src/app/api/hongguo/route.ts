/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-11-23 19:20:00
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-23 19:20:00
 * @Description: 红果短剧-热播榜（官网公开榜单页：热播 / 真人 / AI剧 / 漫剧）
 */
import {
  HONGGUO_BASE,
  HONGGUO_BOARD_TABS,
  hongguoRankUrl,
  parseHongguoRankPage,
} from '@/lib/hongguo'
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HongguoBoardKey } from '@/lib/hongguo'
import type { HotListItem } from '@/types'

const PAGE_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Referer': `${HONGGUO_BASE}/`,
}

async function fetchPage(slug: string, page: number, board: HongguoBoardKey): Promise<HotListItem[]> {
  const html = await fetchText(hongguoRankUrl(slug, page), { headers: PAGE_HEADERS })
  const items = parseHongguoRankPage(html, board)
  if (!items.length)
    throw new Error(`${slug} 第 ${page} 页为空`)
  return items
}

async function fetchBoard(board: HongguoBoardKey, slug: string): Promise<HotListItem[]> {
  const items = await fetchPage(slug, 1, board)
  try {
    const more = await fetchPage(slug, 2, board)
    const seen = new Set(items.map(item => String(item.id)))
    for (const item of more) {
      if (seen.has(String(item.id)))
        continue
      items.push(item)
    }
  }
  catch (error) {
    // 第 2 页偶发 404 时仍保留首页，避免整榜丢失
    console.error(`红果 ${slug} 第 2 页失败，仅保留首页：`, error)
  }
  return items
}

export async function GET() {
  try {
    const settled = await Promise.allSettled(
      HONGGUO_BOARD_TABS.map(tab => fetchBoard(tab.key, tab.slug)),
    )
    const result = settled.flatMap(item => item.status === 'fulfilled' ? item.value : [])
    if (!result.length) {
      const reason = settled.find(item => item.status === 'rejected')
      throw reason?.status === 'rejected' ? reason.reason : new Error('红果榜单为空')
    }
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
