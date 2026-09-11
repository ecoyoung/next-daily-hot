/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 爱奇艺-热播榜（移植自 newsnow，MIT）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（热播榜卡片接口，device 参数必需）
  const url = 'https://mesh.if.iqiyi.com/portal/lw/v7/channel/card/videoTab?channelName=recommend'
    + '&data_source=v7_rec_sec_hot_rank_list&tempId=85&count=30&block_id=hot_ranklist'
    + '&device=14a4b5ba98e790dce6dc07482447cf48&from=webapp'
  try {
    const resp = await fetchJson<any>(url, {
      headers: { Referer: 'https://www.iqiyi.com' },
    })
    const items = resp?.items?.[0]?.video?.[0]?.data ?? []
    const result: HotListItem[] = items.map((item: any) => ({
      id: item.entity_id,
      title: item.title,
      desc: item.desc || item.description?.slice(0, 40),
      hot: item.rank_prefix,
      tip: item.showDate?.slice(0, 10),
      url: item.page_url,
      mobileUrl: item.page_url,
    })).filter((v: HotListItem) => v.title && v.url)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
