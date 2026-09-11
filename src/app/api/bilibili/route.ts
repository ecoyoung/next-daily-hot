/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:21:42
 * @Description: 哔哩哔哩-热搜榜（与手机端搜索热榜一致；原热门视频榜接口为 ranking/v2）
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（App 搜索页热搜榜接口）
  const url = 'https://app.bilibili.com/x/v2/search/trending/ranking'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchJson(url, {
      headers: {
        Referer: 'https://www.bilibili.com/',
      },
    })
    const toHot = (v: any, label?: string): HotListItem => {
      const keyword = v.keyword ?? ''
      const link = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`
      return {
        id: v.hot_id ?? keyword,
        // show_name 是 App 展示用完整标题，keyword 是搜索词
        title: v.show_name || keyword,
        desc: keyword,
        label,
        url: link,
        mobileUrl: link,
      }
    }
    // 置顶热搜在前，普通热搜在后（与手机端一致）
    const result: HotListItem[] = [
      ...(responseBody?.data?.top_list ?? []).map((v: any) => toHot(v, '置顶')),
      ...(responseBody?.data?.list ?? []).map((v: any) => toHot(v)),
    ].filter(v => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
