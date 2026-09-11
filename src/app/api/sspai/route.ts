/*
 * @Description: 少数派-热门文章（移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（热门文章标签页）
  const url = 'https://sspai.com/api/v1/article/tag/page/get?limit=30&offset=0&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0&released=false'
  try {
    const responseBody = await fetchJson<any>(url, {
      headers: { Referer: 'https://sspai.com/' },
    })
    const result: HotListItem[] = (responseBody?.data ?? []).map((k: any) => ({
      id: k.id,
      title: k.title,
      url: `https://sspai.com/post/${k.id}`,
      mobileUrl: `https://sspai.com/post/${k.id}`,
    })).filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
