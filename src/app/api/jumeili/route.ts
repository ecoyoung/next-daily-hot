/*
 * @Description: 聚美丽 - 最新资讯
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（首页主列表为服务端渲染，按发布时间新到旧）
  const url = 'https://wx.jumeili.cn/'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchText(url, {
      headers: {
        Referer: 'https://wx.jumeili.cn/',
        Accept: 'text/html',
      },
    })
    const $ = cheerio.load(responseBody)
    const listDom = $('article#list section.lstb')
    const result: HotListItem[] = listDom.toArray().map((item) => {
      const dom = $(item)
      // section id 形如 newsid48035
      const id = (dom.attr('id') ?? '').replace(/\D/g, '')
      const href = dom.find('a.title').attr('href') ?? ''
      const link = `https://wx.jumeili.cn${href}`
      return {
        id: id || href,
        title: dom.find('a.title').text().trim(),
        desc: dom.find('.art-name').text().trim(),
        tip: dom.find('time').text().trim(),
        url: link,
        mobileUrl: link,
      }
    }).filter(v => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
