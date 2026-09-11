/*
 * @Description: 华尔街见闻-快讯（接口移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（实时快讯流）
  const url = 'https://api-one.wallstcn.com/apiv1/content/lives?channel=global-channel&limit=30'
  try {
    const responseBody = await fetchJson<any>(url)
    const result: HotListItem[] = (responseBody?.data?.items ?? []).map((v: any) => ({
      id: v.id,
      title: v.title || v.content_text,
      desc: v.content_short,
      tip: v.display_time ? new Date(v.display_time * 1000 + 8 * 3600 * 1000).toISOString().slice(11, 16) : undefined,
      url: v.uri,
      mobileUrl: v.uri,
    })).filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
