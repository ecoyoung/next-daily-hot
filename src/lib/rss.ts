/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 轻量 RSS/Atom 解析（regex 提取 item 的 title/link/pubDate/description），供 RSS 型榜单源使用
 */

export interface RssItem {
  title: string
  link: string
  pubDate?: string
  description?: string
}

/** 解析 RSS 2.0 / Atom 的条目列表 */
export function parseRss(xmlText: string): RssItem[] {
  const blocks = xmlText.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/g) ?? []
  return blocks.map((block) => {
    const link = tag(block, 'link') ?? block.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? ''
    return {
      title: tag(block, 'title') ?? '',
      link,
      pubDate: tag(block, 'pubDate') ?? tag(block, 'published') ?? tag(block, 'updated'),
      description: tag(block, 'description') ?? tag(block, 'summary'),
    }
  }).filter(v => v.title && v.link)
}

/** RSS 日期 → MM-DD 展示 */
export function rssDateToMonthDay(pubDate?: string): string | undefined {
  if (!pubDate)
    return undefined
  const ts = new Date(pubDate).getTime()
  if (Number.isNaN(ts))
    return undefined
  return new Date(ts + 8 * 60 * 60 * 1000).toISOString().slice(5, 10)
}

function tag(xml: string, name: string): string | undefined {
  const m = xml.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${name}>|<${name}[^>]*>([\\s\\S]*?)</${name}>`))
  const raw = m ? (m[1] ?? m[2]) : undefined
  if (raw == null)
    return undefined
  return raw.trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, '\'')
}
