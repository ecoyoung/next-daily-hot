/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: Solidot-资讯（RSS）
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'
import { parseRss, rssDateToMonthDay } from '@/lib/rss'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url
  const url = 'https://www.solidot.org/index.rss'
  try {
    const xml = await fetchText(url, {
      headers: { Referer: 'https://www.solidot.org/' },
    })
    const result: HotListItem[] = parseRss(xml).map(item => ({
      id: item.link,
      title: item.title,
      desc: item.description?.replace(/<[^>]+>/g, '').slice(0, 60),
      tip: rssDateToMonthDay(item.pubDate),
      url: item.link,
      mobileUrl: item.link,
    }))
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
