/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 金十数据-快讯（移植自 newsnow，MIT）
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（JS 变量形式的最新快讯）
  const url = 'https://www.jin10.com/flash_newest.js'
  try {
    const rawData = await fetchText(url, {
      headers: { Referer: 'https://www.jin10.com/' },
    })
    const jsonStr = rawData
      .replace(/^var\s+newest\s*=\s*/, '')
      .replace(/;*$/, '')
      .trim()
    const data: any[] = JSON.parse(jsonStr)
    const result: HotListItem[] = data
      .filter(k => (k.data?.title || k.data?.content) && !k.channel?.includes(5))
      .map((k) => {
        const text = (k.data.title || k.data.content).replace(/<\/?b>/g, '')
        const [, title, desc] = text.match(/^【([^】]*)】(.*)$/) ?? []
        return {
          id: k.id,
          title: title ?? text,
          desc: desc ? String(desc).slice(0, 60) : undefined,
          label: k.important ? '重要' : undefined,
          tip: k.time?.slice(11, 16),
          url: `https://flash.jin10.com/detail/${k.id}`,
          mobileUrl: `https://flash.jin10.com/detail/${k.id}`,
        }
      })
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}
