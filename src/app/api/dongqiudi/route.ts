/*
 * @Description: 懂球帝-热门（移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（App 首页第一个 tab）
  const url = 'https://api.dongqiudi.com/app/tabs/web/1.json'
  try {
    const res = await fetchJson<any>(url, {
      headers: { Referer: 'https://www.dongqiudi.com/' },
    })
    const result: HotListItem[] = (res?.articles ?? [])
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        label: item.category || undefined,
        url: item.share || item.url || `https://www.dongqiudi.com/article/${item.id}`,
        mobileUrl: item.share || item.url || `https://www.dongqiudi.com/article/${item.id}`,
      }))
      .filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
