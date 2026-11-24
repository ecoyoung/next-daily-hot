/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2024-05-11 14:37:26
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-19 11:20:00
 * @Description: 微博-热搜榜（App 热搜 / 文娱 / 社会 / 生活 独立子榜）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'
import { WEIBO_BOARD_TABS, weiboSearchallUrl } from '@/lib/weibo'

import type { WeiboBoardKey } from '@/lib/weibo'
import type { HotListItem } from '@/types'

const UA_WEIBO_APP = 'Weibo/81434 (iPhone; iOS 16.6; Scale/3.00)'

export async function GET() {
  try {
    const boards = await Promise.all(WEIBO_BOARD_TABS.map(async (tab) => {
      const list = await fetchBoard(tab.key)
      if (!list.length)
        console.error(`微博子榜为空或失败：${tab.key}`)
      return list
    }))
    const result = boards.flat()
    if (!result.length)
      return errorResponse()
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

async function fetchBoard(board: WeiboBoardKey): Promise<HotListItem[]> {
  const responseBody = await fetchJson<any>(weiboSearchallUrl(board), {
    headers: {
      'User-Agent': UA_WEIBO_APP,
      'Accept': 'application/json',
      'Referer': 'https://m.weibo.cn/',
    },
  }).catch(() => null)
  const cards: any[] = responseBody?.cards ?? []
  const group = cards.find((c: any) => c?.card_type === 11 && Array.isArray(c.card_group) && c.card_group.length > 5)?.card_group
  if (!Array.isArray(group))
    return []

  const seen = new Set<string>()
  const result: HotListItem[] = []
  for (const v of group) {
    const title = String(v.desc ?? '').trim()
    if (!title || v.card_type === 42)
      continue
    const query = extractQuery(v.scheme) || title
    const key = query.startsWith('#') ? query : `#${query}#`
    const id = `${board}:${title}`
    if (seen.has(id))
      continue
    seen.add(id)
    const hot = Number(v.desc_extr)
    result.push({
      id,
      title,
      desc: key,
      hot: Number.isFinite(hot) && hot > 0 ? hot : undefined,
      url: `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&t=31&band_rank=1&Refer=top`,
      mobileUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&t=31&band_rank=1&Refer=top`,
      board,
    })
  }
  return result
}

function extractQuery(scheme?: string): string | undefined {
  if (!scheme)
    return undefined
  try {
    const q = new URL(scheme).searchParams.get('q')
    return q ? decodeURIComponent(q) : undefined
  }
  catch {
    const m = scheme.match(/[?&]q=([^&]+)/)
    return m ? decodeURIComponent(m[1]) : undefined
  }
}
