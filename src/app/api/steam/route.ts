/*
 * @Description: Steam-热门游戏在线榜（HTML 解析，移植自 newsnow，MIT）
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（当前玩家数统计页）
  const url = 'https://store.steampowered.com/stats/stats/'
  try {
    const response = await fetchText(url, {
      headers: { Referer: 'https://store.steampowered.com/' },
    })
    const $ = cheerio.load(response)
    const result: HotListItem[] = []
    $('#detailStats tr.player_count_row').each((_, el) => {
      const dom = $(el)
      const a = dom.find('a.gameLink')
      const href = a.attr('href')
      const name = a.text().trim()
      const players = dom.find('td:first-child .currentServers').text().trim()
      if (href && name && players)
        result.push({ id: href, title: name, hot: players, url: href, mobileUrl: href })
    })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
