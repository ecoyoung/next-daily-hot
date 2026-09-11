/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 格隆汇-资讯（HTML 解析，移植自 newsnow，MIT）
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url
  const baseURL = 'https://www.gelonghui.com'
  try {
    const responseBody = await fetchText(`${baseURL}/news/`, {
      headers: { Referer: 'https://www.gelonghui.com/' },
    })
    const $ = cheerio.load(responseBody)
    const result: HotListItem[] = []
    $('.article-content').each((_, el) => {
      const dom = $(el)
      const href = dom.find('.detail-right>a').attr('href')
      const title = dom.find('.detail-right>a h2').text().trim()
      const info = dom.find('.time > span:nth-child(1)').text().trim()
      if (href && title)
        result.push({ id: href, title, label: info || undefined, url: baseURL + href, mobileUrl: baseURL + href })
    })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
