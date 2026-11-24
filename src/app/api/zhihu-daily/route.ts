/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-01-26 15:16:29
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 知乎日报 - 推荐榜
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url
  const url = 'https://daily.zhihu.com/api/4/news/latest'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchJson(url, {
      headers: {
        Referer: 'https://daily.zhihu.com/api/4/news/latest',
        Host: 'daily.zhihu.com',
      },
    })
    const stories = responseBody?.stories ?? []
    const tops = responseBody?.top_stories ?? []
    const seen = new Set<number>()
    const result: HotListItem[] = []
    for (const item of [...tops, ...stories]) {
      if (!item?.id || !item.title || seen.has(item.id))
        continue
      seen.add(item.id)
      const storyUrl = item.url || `https://daily.zhihu.com/story/${item.id}`
      result.push({
        id: item.id,
        title: item.title,
        url: storyUrl,
        mobileUrl: storyUrl,
      })
    }
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
