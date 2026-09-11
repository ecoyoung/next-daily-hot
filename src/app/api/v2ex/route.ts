/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: V2EX-热门分享（合并多节点 JSON Feed，移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（create/ideas/programmer/share 四个节点的 JSON Feed）
  const nodes = ['create', 'ideas', 'programmer', 'share']
  try {
    const feeds = await Promise.all(nodes.map(k =>
      fetchJson<any>(`https://www.v2ex.com/feed/${k}.json`, {
        headers: { Referer: 'https://www.v2ex.com/' },
      }).catch(() => ({ items: [] })),
    ))
    const result: HotListItem[] = feeds
      .map(k => k?.items ?? [])
      .flat()
      .map((k: any) => ({
        id: k.id,
        title: k.title,
        tip: (k.date_modified ?? k.date_published ?? '').slice(5, 10),
        url: k.url,
        mobileUrl: k.url,
      }))
      .filter((v: HotListItem) => v.title)
      // 按发布时间倒序
      .sort((a: any, b: any) => (a.tip < b.tip ? 1 : -1))
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
