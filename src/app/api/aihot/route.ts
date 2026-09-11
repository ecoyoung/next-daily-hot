/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: AIHOT - AI 产品动态
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（AI 产品分类动态，页面数据内嵌于 RSC flight payload）
  const url = 'https://aihot.virxact.com/all?category=ai-products&page=1'
  try {
    // 请求数据（统一 UA + 超时）
    const responseBody = await fetchText(url, {
      headers: {
        Referer: 'https://aihot.virxact.com/',
        Accept: 'text/html',
      },
    })
    const items = extractInitialItems(extractFlightPayload(responseBody))
    const result: HotListItem[] = items
      // linkedPrimary 非空是被聚合到主故事的重复条目；url 只放行 http(s) 原文链接
      .filter(v => !v.linkedPrimary && v.titleZh && /^https?:\/\//.test(v.url ?? ''))
      .map((v: any) => ({
        id: v.id,
        title: v.titleZh,
        desc: (v.summaryZh ?? '').replace(/\s+/g, ' ').trim(),
        hot: v.finalScore,
        label: v.aiTags?.[0]?.tag,
        // 直达原文（IT之家 / X / GitHub 等），而非站内故事页
        url: v.url,
        mobileUrl: v.url,
      }))
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

/**
 * 从 HTML 中提取 RSC flight payload：
 * 逐段扫描 self.__next_f.push([1,"…"])，按转义规则找到字符串真实结尾后 JSON.parse，
 * 不能用懒惰正则——页面 CSS 中含 `"])` 字样会被误截断
 */
function extractFlightPayload(html: string): string {
  const marker = 'self.__next_f.push([1,'
  let payload = ''
  let pos = 0
  while (pos < html.length) {
    const s = html.indexOf(marker, pos)
    if (s === -1)
      break
    let i = s + marker.length
    if (html[i] !== '"') {
      pos = s + 1
      continue
    }
    i++
    let esc = false
    for (; i < html.length; i++) {
      const c = html[i]
      if (esc) {
        esc = false
        continue
      }
      if (c === '\\') {
        esc = true
        continue
      }
      if (c === '"')
        break
    }
    payload += JSON.parse(html.slice(s + marker.length, i + 1))
    pos = i + 1
  }
  return payload
}

/** 从 payload 中括号配平提取 initialItems 数组（跳过字符串内的方括号） */
function extractInitialItems(payload: string): any[] {
  const key = '"initialItems":'
  const start = payload.indexOf(key)
  if (start === -1)
    return []
  let i = start + key.length
  let depth = 0
  let inStr = false
  let esc = false
  for (; i < payload.length; i++) {
    const c = payload[i]
    if (esc) {
      esc = false
      continue
    }
    if (c === '\\') {
      esc = true
      continue
    }
    if (c === '"') {
      inStr = !inStr
      continue
    }
    if (inStr)
      continue
    if (c === '[')
      depth++
    if (c === ']') {
      depth--
      if (depth === 0)
        break
    }
  }
  try {
    return JSON.parse(payload.slice(start + key.length, i + 1))
  }
  catch {
    return []
  }
}
