/*
 * @Description: Premium Beauty News - 美妆产业资讯
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（首页为服务端渲染，文章链接形如 en/{slug},{id}；首页不含日期，栏目分类做标签）
  const url = 'https://www.premiumbeautynews.com/'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchText(url, {
      headers: {
        'Referer': 'https://www.premiumbeautynews.com/',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html',
      },
    })
    const $ = cheerio.load(responseBody)
    const seen = new Set<string>()
    const result: HotListItem[] = []
    $('a[href]').toArray().forEach((el) => {
      const link = $(el)
      const href = link.attr('href') ?? ''
      // 仅文章链接（结尾必须是数字 ID，排除 ,27453,en 这类栏目跳转）；缩略图链接无文本自然跳过
      if (!/^en\/[a-z0-9-]+,\d+$/i.test(href))
        return
      const title = link.text().replace(/\s+/g, ' ').trim()
      if (!title)
        return
      // 向上回溯到条目容器（Bootstrap 列/item）。不能走满到 body：
      // 页面任意位置存在一个 Sponsored 标记就会误杀全部条目
      let wrap = link
      for (let i = 0; i < 8; i++) {
        const parent = wrap.parent()
        if (parent.length === 0 || parent.is('body'))
          break
        wrap = parent
        const cls = wrap.attr('class') ?? ''
        if (/(?:^|\s)(?:item|post-wrapper)(?:\s|$)|col-(?:xs|sm|md|lg)/.test(cls))
          break
      }
      // 跳过标注 Sponsored 的广告块（不记入 seen，同一文章的编辑位仍可收录）
      if (wrap.find('.post-thumb-tag').first().text().includes('Sponsored'))
        return
      if (seen.has(href))
        return
      seen.add(href)
      const category = wrap.find('span.color-1').first().text().replace(/\s+/g, ' ').trim()
      const articleUrl = new URL(href, 'https://www.premiumbeautynews.com/').toString()
      result.push({
        // 链接形如 en/{slug},28163
        id: href.match(/,(\d+)/)?.[1] ?? href,
        title,
        label: category || undefined,
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
