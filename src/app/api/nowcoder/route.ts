/*
 * @Description: 牛客-热榜（移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（PC 端热搜接口）
  const url = 'https://gw-c.nowcoder.com/api/sparta/hot-search/top-hot-pc?size=20&t='
  try {
    const responseBody = await fetchJson<any>(url, {
      headers: { Referer: 'https://www.nowcoder.com/' },
    })
    const result: HotListItem[] = (responseBody?.data?.result ?? []).map((k: any) => {
      let link: string | undefined
      let id: string | undefined
      if (k.type === 74) {
        link = `https://www.nowcoder.com/feed/main/detail/${k.uuid}`
        id = k.uuid
      }
      else if (k.type === 0) {
        link = `https://www.nowcoder.com/discuss/${k.id}`
        id = k.id
      }
      return { id, title: k.title, url: link, mobileUrl: link }
    }).filter((v: HotListItem) => v.title && v.url)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
