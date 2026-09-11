/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 雪球-热股榜（需先取首页 Cookie，移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（热股榜接口，需携带首页下发 Cookie）
  const url = 'https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=30&_type=10&type=10'
  try {
    // 先访问行情页拿 cookie（xq_a_id 等）
    const homeResp = await fetch('https://xueqiu.com/hq', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000),
    })
    const cookies = homeResp.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
    const responseBody = await fetchJson<any>(url, {
      headers: { Cookie: cookies, Referer: 'https://xueqiu.com/hq' },
    })
    const result: HotListItem[] = (responseBody?.data?.items ?? [])
      .filter((v: any) => !v.ad)
      .map((v: any) => ({
        id: v.code,
        title: v.name,
        hot: `${v.percent}%`,
        label: v.exchange,
        url: `https://xueqiu.com/s/${v.code}`,
        mobileUrl: `https://xueqiu.com/s/${v.code}`,
      }))
      .filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
