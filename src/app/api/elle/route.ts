/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: ELLE中文网 - 美容速报
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（页面为 Next.js SSR，列表数据内嵌在 __NEXT_DATA__ 中）
  const url = 'https://www.ellechina.com/beauty/beauty-news/'
  try {
    // 请求数据（统一 UA + 超时）
    const html = await fetchText(url, {
      headers: {
        Referer: 'https://www.ellechina.com/',
        Accept: 'text/html',
      },
    })
    // 提取 __NEXT_DATA__ JSON
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (!match) {
      console.error('上游页面缺少 __NEXT_DATA__')
      return errorResponse()
    }
    const pageProps = JSON.parse(match[1])?.props?.pageProps
    // 页面由多个 feed block 组成，资源按板块去重后合并
    const resources: any[] = (pageProps?.data?.feedInfo ?? [])
      .flatMap((feed: any) => feed?.blocks ?? [])
      .flatMap((block: any) => block?.feeds ?? [])
      .flatMap((feed: any) => feed?.resources ?? [])

    const seen = new Set<string>()
    const publishTime = new Map<number, number>()
    const result: HotListItem[] = []
    for (const v of resources) {
      if (!v?.id || seen.has(v.id))
        continue
      seen.add(v.id)

      const title = (v.metadata?.short_title || v.metadata?.index_title || v.slug || '')
        .replace(/\s+/g, ' ')
        .trim()
      if (!title)
        continue

      if (v.publish_from)
        publishTime.set(v.display_id, new Date(v.publish_from).getTime())

      const link = `https://www.ellechina.com/${v.section?.slug ?? 'beauty'}/${v.subsection?.slug ?? 'beauty-news'}/${v.display_id}/${v.slug}/`
      result.push({
        id: v.display_id,
        title,
        desc: stripHtml(v.metadata?.dek ?? ''),
        tip: v.publish_from ? formatBeijingDate(v.publish_from) : undefined,
        url: link,
        mobileUrl: link,
      })
    }
    // 按发布时间倒序（页面 block 顺序不保证全局有序）
    result.sort((a, b) => (publishTime.get(Number(b.id)) ?? 0) - (publishTime.get(Number(a.id)) ?? 0))
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

/** 北京时间日期（MM-DD）：publish_from 是 UTC，ELLE 站点按中国日期展示 */
function formatBeijingDate(iso: string): string {
  const beijing = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000)
  return beijing.toISOString().slice(5, 10)
}

/** 去除 dek 中的 HTML 标签并压缩空白 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
