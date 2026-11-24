/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-19 10:40:00
 * @Description: 法布财经-快讯（HTML 解析，移植自 newsnow，MIT）
 */
import * as cheerio from 'cheerio'

import { fetchJson, fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  try {
    const fromHtml = await scrapeInternational()
    if (fromHtml.length)
      return successResponse(fromHtml)
    return successResponse(await scrapeChinaCalendarFallback())
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

/** 国际站快讯页；大陆 IP 会被 302 到 accessDenied 占位页 */
async function scrapeInternational(): Promise<HotListItem[]> {
  const baseURL = 'https://www.fastbull.com'
  const responseBody = await fetchText(`${baseURL}/cn/express-news`, {
    headers: { Referer: 'https://www.fastbull.com/' },
  })
  if (responseBody.includes('accessDenied') || responseBody.includes('访问提示'))
    return []
  const $ = cheerio.load(responseBody)
  const result: HotListItem[] = []
  $('.content-list.news-list').each((_, el) => {
    const dom = $(el)
    const titleText = dom.find('.title_name').text().trim()
    const title = titleText.match(/【(.+)】/)?.[1] ?? titleText
    const href = dom.find('[data-href]').attr('data-href') ?? dom.find('[data-id]').attr('data-id')
    const date = dom.attr('data-date')
    if (href && title && date)
      result.push({ id: href, title, tip: date.slice(5, 10), url: baseURL + href, mobileUrl: baseURL + href })
  })
  return result
}

/**
 * 大陆站快讯接口需要客户端签名且集群时常 500。
 * 经济日历合并接口可匿名拉取，作为降级数据源。
 */
async function scrapeChinaCalendarFallback(): Promise<HotListItem[]> {
  const url = 'https://api.fastbull.cn/fastbull-news-service/api/getWebHomeNewsCalendarMergePageV1?pageSize=30&pageIndex=1'
  const responseBody = await fetchJson<any>(url, {
    headers: {
      'Referer': 'https://www.fastbull.cn/',
      'Origin': 'https://www.fastbull.cn',
      'Accept': 'application/json, text/plain, */*',
    },
  })
  const raw = responseBody?.bodyMessage
  const rows: any[] = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])
  const result: HotListItem[] = []
  for (const row of rows) {
    const calendar = row.calendarDataModel
    const event = row.calenderEventModel
    const title: string | undefined = calendar?.title || event?.eventContent || event?.speaker
    if (!title)
      continue
    const ts = Number(row.releasedDate || calendar?.releasedDate || event?.releasedDate)
    const tip = Number.isFinite(ts)
      ? new Date(ts + 8 * 3600 * 1000).toISOString().slice(11, 16)
      : undefined
    const star = calendar?.star ?? event?.star
    const descParts = calendar
      ? [calendar.country, calendar.previous != null ? `前值 ${calendar.previous}${calendar.unit ?? ''}` : null]
      : [event?.country, event?.speaker]
    result.push({
      id: String(calendar?.path || event?.path || event?.eventId || ts || title),
      title,
      desc: descParts.filter(Boolean).join(' · ') || undefined,
      label: star ? `${star}星` : undefined,
      tip,
      url: 'https://www.fastbull.cn/',
      mobileUrl: 'https://www.fastbull.cn/',
    })
  }
  return result
}
