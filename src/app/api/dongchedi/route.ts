/*
 * @Description: 懂车帝 - 今日资讯
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（原 /news 页面已加登录墙 302，改用首页内嵌的今日资讯数据）
  const url = 'https://www.dongchedi.com/'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchText(url, {
      headers: {
        Referer: 'https://www.dongchedi.com/',
        Accept: 'text/html',
      },
    })
    // 提取 __NEXT_DATA__ JSON
    const match = responseBody.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) {
      console.error('上游页面缺少 __NEXT_DATA__')
      return errorResponse()
    }
    const todayNews = JSON.parse(match[1])?.props?.pageProps?.todayNews
    // 头部精选在前，普通资讯在后
    const articles: any[] = [
      ...(todayNews?.head_article ?? []),
      ...(todayNews?.content_article ?? []),
    ]
    const result: HotListItem[] = articles.map((v) => {
      const link = `https://www.dongchedi.com/article/${v.gid_str}.html`
      return {
        id: v.gid_str,
        title: v.title,
        label: v.hot === 1 ? '热' : undefined,
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
