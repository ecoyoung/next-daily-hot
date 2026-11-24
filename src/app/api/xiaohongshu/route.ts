/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-24 11:20:00
 * @Description: 小红书热榜（官网 H5 接口，不再使用 2023 年写死的客户端签名）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'
import { XHS_HOT_PATH, signXiaohongshuV1, xiaohongshuHotUrl } from '@/lib/xiaohongshu'

import type { HotListItem } from '@/types'

export async function GET() {
  const sign = signXiaohongshuV1(XHS_HOT_PATH)
  try {
    const responseBody = await fetchJson<any>(xiaohongshuHotUrl(), {
      cache: 'no-store',
      headers: {
        'Referer': 'https://www.xiaohongshu.com/search/hot',
        'Origin': 'https://www.xiaohongshu.com',
        'x-s': sign.xs,
        'x-t': sign.xt,
        'x-s-common': sign.common,
      },
    })
    const items = responseBody?.data?.items ?? []
    const result: HotListItem[] = items.map((item: any) => ({
      id: item.id,
      title: item.title,
      hot: item.score,
      label: (!item.word_type || item.word_type === '无') ? undefined : item.word_type,
      url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title)}`,
      mobileUrl: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(item.title)}`,
    })).filter((item: HotListItem) => item.title)
    if (!result.length)
      return errorResponse()
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
