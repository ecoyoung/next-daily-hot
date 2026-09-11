/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 参考消息-要闻（移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（中国/观点/国际三个频道 JSON）
  try {
    const res = await Promise.all(['zhongguo', 'guandian', 'gj'].map(k =>
      fetchJson<any>(`http://china.cankaoxiaoxi.com/json/channel/${k}/list.json`).catch(() => ({ list: [] })),
    ))
    const result: HotListItem[] = res
      .map(k => k?.list ?? [])
      .flat()
      .map((k: any) => ({
        id: k.data?.id,
        title: k.data?.title,
        tip: k.data?.publishTime?.slice(5, 10),
        url: k.data?.url,
        mobileUrl: k.data?.url,
      }))
      .filter((v: HotListItem) => v.title && v.url)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
