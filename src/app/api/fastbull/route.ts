/*
 * @Description: 法布财经-快讯（HTML 解析，移植自 newsnow，MIT）
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url
  const baseURL = 'https://www.fastbull.com'
  try {
    const responseBody = await fetchText(`${baseURL}/cn/express-news`, {
      headers: { Referer: 'https://www.fastbull.com/' },
    })
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
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
