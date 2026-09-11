/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2024-05-11 14:37:26
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 微博-热搜榜
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url
  const url = 'https://weibo.com/ajax/side/hotSearch'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchJson(url, {
      headers: {
        Referer: 'https://weibo.com/',
        Accept: 'application/json',
      },
    })
    // 处理数据
    if (responseBody.ok === 1) {
      const result: HotListItem[] = responseBody.data.realtime.map((v: any) => {
        const key = v.word_scheme ? v.word_scheme : `#${v.word}`
        return {
          id: v.mid,
          title: v.word,
          desc: key,
          hot: v.num,
          label: v.label_name,
          url: `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&t=31&band_rank=1&Refer=top`,
          mobileUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&t=31&band_rank=1&Refer=top`,
        }
      })
      return successResponse(result)
    }
    return successResponse()
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
