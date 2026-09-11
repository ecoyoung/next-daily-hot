/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:31:22
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:31:22
 * @Description: 界面新闻-资讯
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'
import { parseRss, rssDateToMonthDay } from '@/lib/rss'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（RSS 订阅源）
  const url = 'https://a.jiemian.com/index.php?m=article&a=rss'
  try {
    // 请求数据（统一 UA + 超时）
    const xml = await fetchText(url, {
      headers: {
        Referer: 'https://www.jiemian.com/',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
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
