/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: Cosmetics Business - 美妆产业资讯
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（无独立 /news 栏目，首页即最新资讯流，条目为 .block-inner > a，标题在 a > h3）
  const url = 'https://cosmeticsbusiness.com/'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchText(url, {
      headers: {
        'Referer': 'https://cosmeticsbusiness.com/',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html',
      },
    })
    const $ = cheerio.load(responseBody)
    const seen = new Set<string>()
    const result: HotListItem[] = []
    $('.block-inner a[href]').toArray().forEach((el) => {
      const link = $(el)
      const href = link.attr('href') ?? ''
      // 仅一级文章 slug，排除栏目/标签页
      if (!/^\/[a-z0-9-]{15,}$/.test(href) || seen.has(href))
        return
      seen.add(href)
      const title = link.find('h3').first().text().replace(/\s+/g, ' ').trim()
      if (!title)
        return
      const articleUrl = `https://cosmeticsbusiness.com${href}`
      result.push({
        id: href,
        title,
        desc: link.find('.tooltip').first().text().replace(/\s+/g, ' ').trim(),
        url: articleUrl,
        mobileUrl: articleUrl,
      })
    })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
