/*
 * @Description: Hacker News-热榜（HTML 解析，移植自 newsnow，MIT）
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url
  const baseURL = 'https://news.ycombinator.com'
  try {
    const html = await fetchText(baseURL, {
      headers: { Referer: 'https://news.ycombinator.com/' },
    })
    const $ = cheerio.load(html)
    const result: HotListItem[] = []
    $('.athing').each((_, el) => {
      const id = $(el).attr('id')
      const a = $(el).find('.titleline a').first()
      const title = a.text().trim()
      const score = $(`#score_${id}`).text().replace(/\s+/g, ' ').trim()
      if (id && title) {
        result.push({
          id,
          title,
          hot: score,
          url: `${baseURL}/item?id=${id}`,
          mobileUrl: `${baseURL}/item?id=${id}`,
        })
      }
    })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
