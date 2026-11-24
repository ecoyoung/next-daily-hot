/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:31:22
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:31:22
 * @Description: AIBot-每日 AI 资讯
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'
import { parseRss, rssDateToMonthDay } from '@/lib/rss'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（RSS 订阅源）
  const url = 'https://rsshub.dicomp.net/ai-bot/daily-ai-news'
  try {
    // 请求数据（统一 UA + 超时）
    const xml = await fetchText(url, {
      headers: {
        Referer: 'https://rsshub.dicomp.net/',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    const items = parseRss(xml)
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = items.filter((item) => {
      const ts = item.pubDate ? new Date(item.pubDate).getTime() : 0
      return ts >= cutoff
    })
    // 整份 RSS 有数百条历史稿，只留近 7 天
    const picked = (recent.length ? recent : items).slice(0, 30)
    const result: HotListItem[] = picked.map(item => ({
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
