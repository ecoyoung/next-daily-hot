/*
 * @Description: 凤凰网-热点（首页内嵌数据，移植自 newsnow，MIT）
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（首页 allData 变量中的热点新闻）
  const url = 'https://www.ifeng.com/'
  try {
    const html = await fetchText(url, {
      headers: { Referer: 'https://www.ifeng.com/' },
    })
    const match = html.match(/var\s+allData\s*=\s*(\{[\s\S]*?\});/)
    if (!match)
      return successResponse()
    const realData = JSON.parse(match[1])
    const result: HotListItem[] = (realData?.hotNews1 ?? []).map((k: any) => ({
      id: k.url,
      title: k.title,
      tip: k.newsTime?.slice(5, 10),
      url: k.url,
      mobileUrl: k.url,
    })).filter((v: HotListItem) => v.title && v.url)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
