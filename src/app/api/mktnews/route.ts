/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: MKTNews-快讯（移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url
  const url = 'https://api.mktnews.net/api/flash?type=0&limit=50'
  try {
    const responseBody = await fetchJson<any>(url, {
      headers: {
        Origin: 'https://mktnews.net',
        Referer: 'https://mktnews.net/',
      },
    })
    const result: HotListItem[] = (responseBody?.data ?? [])
      .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .map((item: any) => {
        const title = item.data?.title || item.data?.content?.match(/^【([^】]*)】/)?.[1] || item.data?.content
        return {
          id: item.id,
          title,
          label: item.important === 1 ? '重要' : undefined,
          tip: item.time?.slice(5, 10),
          url: `https://mktnews.net/flashDetail.html?id=${item.id}`,
          mobileUrl: `https://mktnews.net/flashDetail.html?id=${item.id}`,
        }
      })
      .filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
