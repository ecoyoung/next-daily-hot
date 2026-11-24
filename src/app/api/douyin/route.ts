/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2024-05-14 09:14:07
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-19 11:00:00
 * @Description: 抖音-热点榜（含子分类 sentence_tag）
 */
import { douyinBoardFromTag, douyinBoardLabel, douyinMarkLabel } from '@/lib/douyin'
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（公开热搜列表；子榜没有独立接口，分类在 sentence_tag）
  const url = 'https://aweme.snssdk.com/aweme/v1/hot/search/list/'
  try {
    const responseBody = await fetchJson(url)
    if (responseBody.status_code === 0) {
      const result: HotListItem[] = (responseBody.data.word_list ?? []).map((v: any) => {
        const board = douyinBoardFromTag(Number(v.sentence_tag))
        const cover = v.word_cover?.url_list?.[0]
        return {
          id: v.sentence_id || v.group_id,
          title: v.word,
          pic: cover ? String(cover) : undefined,
          hot: Number(v.hot_value),
          label: douyinMarkLabel(Number(v.label)),
          tip: douyinBoardLabel(board),
          url: `https://www.douyin.com/hot/${encodeURIComponent(v.sentence_id)}`,
          mobileUrl: `https://www.douyin.com/hot/${encodeURIComponent(v.sentence_id)}`,
          board,
        }
      }).filter((v: HotListItem) => v.title)
      return successResponse(result)
    }
    return successResponse()
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
