/*
 * @Description: 联合早报-实时快讯（GB2312 编码页面，移植自 newsnow，MIT）
 */
import { Buffer } from 'node:buffer'

import * as cheerio from 'cheerio'

import { UA_CHROME } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（实时新闻列表，页面为 GB2312 编码需手工解码）
  const url = 'https://www.zaochenbao.com/realtime/'
  const base = 'https://www.zaochenbao.com'
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': UA_CHROME, 'Referer': base },
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 300 },
    })
    if (!response.ok)
      throw new Error(`上游请求失败：${response.status}`)
    // Node TextDecoder 支持 gb18030（兼容 gb2312）
    const html = new TextDecoder('gb18030').decode(Buffer.from(await response.arrayBuffer()))
    const $ = cheerio.load(html)
    const result: HotListItem[] = []
    $('div.list-block>a.item').each((_, el) => {
      const a = $(el)
      const href = a.attr('href')
      const title = a.find('.eps').text().trim()
      const date = a.find('.pdt10').text().replace(/-\s/g, ' ').trim()
      if (href && title && date) {
        result.push({
          id: href,
          title,
          tip: date.slice(5, 10),
          url: base + href,
          mobileUrl: base + href,
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
