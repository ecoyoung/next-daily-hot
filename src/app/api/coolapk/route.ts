/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 酷安-今日热门（App 接口 token 算法移植自 newsnow/RSSHub，MIT）
 */
import { Buffer } from 'node:buffer'
import { createHash, randomBytes } from 'node:crypto'

import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

const md5 = (s: string) => createHash('md5').update(s).digest('hex')

export async function GET() {
  // 官方 url（今日热门帖子）
  const url = 'https://api.coolapk.com/v6/page/dataList?url=%2Ffeed%2FstatList%3FcacheExpires%3D300%26statType%3Dday%26sortField%3Ddetailnum%26title%3D%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&title=%E4%BB%8A%E6%97%A5%E7%83%AD%E9%97%A8&subTitle=&page=1'
  try {
    const responseBody = await fetchJson<any>(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-App-Id': 'com.coolapk.market',
        'X-App-Token': appToken(),
        'X-Sdk-Int': '29',
        'X-Sdk-Locale': 'zh-CN',
        'X-App-Version': '11.0',
        'X-Api-Version': '11',
        'X-App-Code': '2101202',
        // 覆盖默认桌面 UA 为酷安客户端 UA
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; Redmi K30 5G MIUI/V12.0.3.0.QGICMXM) +CoolMarket/11.0-2101202',
      },
    })
    const result: HotListItem[] = (responseBody?.data ?? [])
      .filter((v: any) => v.id)
      .map((v: any) => ({
        id: v.id,
        // message 是多行 HTML，取首行；有编辑标题优先
        title: v.editor_title || v.message?.replace(/<[^>]+>/g, ' ').split('\n')[0]?.trim(),
        hot: v.targetRow?.subTitle,
        tip: v.dateline ? new Date(v.dateline * 1000 + 8 * 3600 * 1000).toISOString().slice(5, 10) : undefined,
        url: `https://www.coolapk.com${v.url}`,
        mobileUrl: `https://www.coolapk.com${v.url}`,
      }))
      .filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

/** 酷安 App 请求 token：md5(base64(token://...)) + 设备ID + 16进制时间 */
function appToken(): string {
  const deviceId = [10, 6, 6, 6, 14].map(n => randomBytes(n).toString('base64url').slice(0, n)).join('-')
  const now = Math.round(Date.now() / 1000)
  const s = `token://com.coolapk.market/c67ef5943784d09750dcfbb31020f0ab?${md5(String(now))}$${deviceId}&com.coolapk.market`
  return `${md5(Buffer.from(s).toString('base64')) + deviceId}0x${now.toString(16)}`
}
