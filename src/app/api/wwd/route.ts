/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: WWD - 美妆特辑
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（PMC 平台服务端渲染，a.c-title__link 为文章标题锚点）
  const url = 'https://wwd.com/beauty-industry-news/beauty-features/'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchText(url, {
      headers: {
        'Referer': 'https://wwd.com/',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html',
      },
    })
    const $ = cheerio.load(responseBody)
    const seen = new Set<string>()
    const result: HotListItem[] = []
    $('a.c-title__link').toArray().forEach((el) => {
      const link = $(el)
      const href = link.attr('href') ?? ''
      if (!href || seen.has(href))
        return
      seen.add(href)
      // &nbsp;（\u00A0）与多余空白压成单空格
      const title = link.text().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
      if (!title)
        return
      // 标题不都在统一的条目容器内，向上回溯到包含 dek/time 的最近祖先
      let wrap = link
      for (let i = 0; i < 6; i++) {
        const parent = wrap.parent()
        if (parent.length === 0 || parent.is('body'))
          break
        wrap = parent
        if (wrap.find('p.c-dek').length || wrap.find('time').length)
          break
      }
      // datetime 属性为坏值（固定 2019），取 aria-label / 文本
      const timeEl = wrap.find('time').first()
      const tip = (timeEl.attr('aria-label') || timeEl.text()).replace(/\s+/g, ' ').trim()
      result.push({
        // 链接结尾形如 -1239196925/ 的文章 ID
        id: href.match(/-(\d{6,})\/?$/)?.[1] ?? href,
        title,
        desc: wrap.find('p.c-dek').first().text().replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim(),
        tip: tip || undefined,
        url: href,
        mobileUrl: href,
      })
    })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
