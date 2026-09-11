/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 化妆品报 - 最新资讯
 */
import * as cheerio from 'cheerio'

import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（首页「最新资讯」模块为服务端渲染，栏目列表页排序不可靠，以首页为准）
  const url = 'https://www.hzpb.com.cn/'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchText(url, {
      headers: {
        Referer: 'https://www.hzpb.com.cn/',
        Accept: 'text/html',
      },
    })
    const $ = cheerio.load(responseBody)
    const listDom = $('a.new-resources-item')
    const result: HotListItem[] = listDom.toArray().map((item) => {
      const dom = $(item)
      const href = dom.attr('href') ?? ''
      // /ldcms/zixun/10168.html → 10168
      const id = href.match(/\/ldcms\/zixun\/(\d+)\.html/)?.[1]
      // 时间行形如「化妆品报｜2026-09-08 10:56:33」，取 MM-DD 与 ELLE 卡片保持一致
      const dateText = dom.find('.new-resources-right > div').last().text().trim()
      const tip = dateText.match(/\d{4}-(\d{2}-\d{2})/)?.[1]
      const link = `https://www.hzpb.com.cn${href}`
      return {
        id: id ?? href,
        title: dom.find('.ts-18').text().trim(),
        desc: dom.find('.ellips_two').text().trim(),
        tip,
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
