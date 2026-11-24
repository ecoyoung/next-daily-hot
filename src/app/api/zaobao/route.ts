/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-24 10:45:00
 * @Description: 联合早报-实时快讯（官网 zaobao.com，早晨报域名已不可达）
 */
import * as cheerio from 'cheerio'

import { parseRelativeTime } from '@/lib/relative-time'
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

const BASE = 'https://www.zaobao.com'

const SECTIONS: { path: string, label: string }[] = [
  { path: '/realtime/china', label: '中国' },
  { path: '/realtime/singapore', label: '新加坡' },
  { path: '/realtime/world', label: '国际' },
  { path: '/realtime/finance', label: '财经' },
]

export async function GET() {
  try {
    const now = Date.now()
    const settled = await Promise.allSettled(SECTIONS.map(section => fetchSection(section, now)))
    const merged = new Map<string, HotListItem & { ts: number }>()
    for (const item of settled) {
      if (item.status !== 'fulfilled')
        continue
      for (const row of item.value) {
        if (!merged.has(row.url))
          merged.set(row.url, row)
      }
    }
    const result: HotListItem[] = [...merged.values()]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 40)
      .map(row => ({
        id: row.id,
        title: row.title,
        label: row.label,
        tip: row.tip,
        url: row.url,
        mobileUrl: row.mobileUrl,
      }))
    if (!result.length) {
      const reason = settled.find(item => item.status === 'rejected')
      throw reason?.status === 'rejected' ? reason.reason : new Error('联合早报列表为空')
    }
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

async function fetchSection(section: { path: string, label: string }, now: number) {
  const html = await fetchText(`${BASE}${section.path}`, {
    cache: 'no-store',
    headers: {
      'Referer': BASE,
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })
  const $ = cheerio.load(html)
  const rows: (HotListItem & { ts: number })[] = []
  $('a.article-link').each((_, el) => {
    const link = $(el)
    const href = link.attr('href') ?? ''
    const title = (link.attr('title') || link.text()).replace(/\s+/g, ' ').trim()
    if (!href || !title || title.includes('订阅'))
      return
    const url = new URL(href, BASE).href
    const when = link.parent().find('span').first().text().trim()
    const parsed = parseRelativeTime(when, now)
    rows.push({
      id: href,
      title,
      label: section.label,
      tip: parsed?.tip,
      url,
      mobileUrl: url,
      ts: parsed?.ts ?? 0,
    })
  })
  if (!rows.length)
    throw new Error(`${section.path} 没有解析到快讯`)
  return rows
}
