/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 虫部落-热帖（HTML 解析，移植自 newsnow，MIT）
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（论坛热门导读）
  const baseUrl = 'https://www.chongbuluo.com/'
  try {
    const html = await fetchText(`${baseUrl}forum.php?mod=guide&view=hot`, {
      headers: { Referer: baseUrl },
    })
    const $ = cheerio.load(html)
    const result: HotListItem[] = []
    $('.bmw table tr').each((_, el) => {
      const title = $(el).find('.common .xst').text().trim()
      const href = $(el).find('.common a').attr('href')
      if (title && href)
        result.push({ id: baseUrl + href, title, url: baseUrl + href, mobileUrl: baseUrl + href })
    })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
