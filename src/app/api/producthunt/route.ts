/*
 * @Description: Product Hunt-新品榜（官方 RSS Feed）
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'
import { parseRss, rssDateToMonthDay } from '@/lib/rss'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（每日新品 RSS）
  const url = 'https://www.producthunt.com/feed'
  try {
    const xml = await fetchText(url, {
      headers: { Referer: 'https://www.producthunt.com/' },
    })
    const result: HotListItem[] = parseRss(xml).map((item) => {
      // feed 标题形如 "ProductName: tagline"
      const [name, tagline] = item.title.split(/:\s*/)
      return {
        id: item.link,
        title: name,
        desc: tagline?.slice(0, 60),
        tip: rssDateToMonthDay(item.pubDate),
        url: item.link,
        mobileUrl: item.link,
      }
    })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
