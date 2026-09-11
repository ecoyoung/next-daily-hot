/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 俄罗斯卫星通讯社-要闻（HTML 解析，移植自 newsnow，MIT）
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（中文版要闻挂件）
  const url = 'https://sputniknews.cn/services/widget/lenta/'
  try {
    const response = await fetchText(url, {
      headers: { Referer: 'https://sputniknews.cn/' },
    })
    const $ = cheerio.load(response)
    const result: HotListItem[] = []
    $('.lenta__item').each((_, el) => {
      const a = $(el).find('a')
      const href = a.attr('href')
      const title = a.find('.lenta__item-text').text().trim()
      const date = a.find('.lenta__item-date').attr('data-unixtime')
      if (href && title && date) {
        const d = new Date(Number(`${date}000`))
        result.push({
          id: href,
          title,
          tip: `${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`,
          url: `https://sputniknews.cn${href}`,
          mobileUrl: `https://sputniknews.cn${href}`,
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
