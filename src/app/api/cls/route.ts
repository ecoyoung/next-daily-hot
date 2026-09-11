/*
 * @Description: 财联社-电报（接口签名移植自 newsnow，MIT）
 */
import { createHash } from 'node:crypto'

import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（电报快讯滚动列表）
  const url = 'https://www.cls.cn/v1/roll/get_roll_list'
  try {
    const query = await signedQuery({
      last_time: (Math.floor(Date.now() / 1000 / 300) * 300).toString(),
      refresh_type: '1',
      rn: '30',
    })
    const responseBody = await fetchJson<any>(`${url}?${query}`, {
      headers: { Referer: 'https://www.cls.cn/telegraph' },
    })
    const result: HotListItem[] = (responseBody?.data?.roll_data ?? [])
      .filter((v: any) => !v.is_ad)
      .map((v: any) => ({
        id: v.id,
        title: v.title || v.brief,
        mobileUrl: v.shareurl,
        tip: v.ctime ? new Date(v.ctime * 1000 + 8 * 3600 * 1000).toISOString().slice(11, 16) : undefined,
        url: `https://www.cls.cn/detail/${v.id}`,
      }))
      .filter((v: HotListItem) => v.title)
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

/** 站方接口签名：参数排序后 SHA-1 再 MD5（参考 RSSHub） */
async function signedQuery(extra: Record<string, string> = {}): Promise<string> {
  const params = new URLSearchParams({ appName: 'CailianpressWeb', os: 'web', sv: '7.7.5', ...extra })
  params.sort()
  const sha1 = createHash('sha1').update(params.toString()).digest('hex')
  const sign = createHash('md5').update(sha1).digest('hex')
  params.append('sign', sign)
  return params.toString()
}
