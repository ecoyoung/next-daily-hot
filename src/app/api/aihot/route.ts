/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-19 10:40:00
 * @Description: AIHOT - AI 产品动态
 */
import { fetchText } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'
import { rssDateToMonthDay } from '@/lib/rss'

import type { HotListItem } from '@/types'

export async function GET() {
  // 官方 url（站点已从 Next.js RSC 迁到 React Router，数据内嵌于 RR stream）
  const url = 'https://aihot.news/all?category=ai-products&page=1'
  try {
    const responseBody = await fetchText(url, {
      headers: {
        'Referer': 'https://aihot.news/',
        'Accept': 'text/html',
      },
    })
    const items = extractItems(responseBody)
    const result: HotListItem[] = items
      .filter(v => v.title)
      .map(v => ({
        id: v.id,
        title: v.title,
        desc: (v.summary ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) || undefined,
        hot: v.score,
        label: v.tags.find(Boolean) || v.sourceName,
        tip: rssDateToMonthDay(v.publishedAt),
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

interface AihotItem {
  id: string
  title: string
  summary: string
  publishedAt?: string
  score?: number
  tags: string[]
  sourceName?: string
  url: string
}

/** 优先 React Router stream；旧版 Next.js RSC payload 作回退 */
function extractItems(html: string): AihotItem[] {
  const fromRouter = extractReactRouterItems(html)
  if (fromRouter.length)
    return fromRouter
  return extractLegacyRscItems(html)
}

function extractReactRouterItems(html: string): AihotItem[] {
  const payload = extractQuotedJsString(html, 'window.__reactRouterContext.streamController.enqueue(')
  if (!payload)
    return []
  let arr: unknown[]
  try {
    arr = JSON.parse(payload) as unknown[]
  }
  catch {
    return []
  }
  const itemsIdx = arr.indexOf('items')
  const ptrs = itemsIdx >= 0 ? arr[itemsIdx + 1] : null
  if (!Array.isArray(ptrs))
    return []

  const result: AihotItem[] = []
  for (const ptr of ptrs) {
    const raw = typeof ptr === 'number' ? arr[ptr] : ptr
    if (!isRecord(raw))
      continue
    const item = decodeRecord(arr, raw)
    const title = typeof item.title === 'string' ? item.title : ''
    const id = typeof item.id === 'string' || typeof item.id === 'number' ? String(item.id) : ''
    if (!title || !id)
      continue
    const x = isRecord(item.x) ? item.x : {}
    const source = isRecord(item.source) ? item.source : {}
    const tags = Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === 'string') : []
    const summary = typeof item.summary === 'string' ? item.summary : ''
    const handle = typeof x.handle === 'string' ? x.handle : undefined
    const fromSummary = summary.match(/https?:\/\/[^\s)\]>'"]+/)?.[0]?.replace(/[。．，,;；]+$/, '')
    const url = fromSummary
      ?? (handle ? `https://x.com/${handle}` : `https://aihot.news/s/${id}`)
    const publishedAt = typeof item.publishedAt === 'string' ? item.publishedAt : undefined
    const score = typeof item.score === 'number' ? item.score : undefined
    const sourceName = typeof source.name === 'string' ? source.name : undefined
    result.push({ id, title, summary, publishedAt, score, tags, sourceName, url })
  }
  return result
}

/** 旧站 Next.js flight：self.__next_f.push([1,"…"]) + initialItems */
function extractLegacyRscItems(html: string): AihotItem[] {
  const payload = extractFlightPayload(html)
  const raw = extractInitialItems(payload)
  return raw
    .filter(v => !v.linkedPrimary && v.titleZh)
    .map((v: any) => ({
      id: String(v.id ?? ''),
      title: String(v.titleZh ?? ''),
      summary: String(v.summaryZh ?? ''),
      publishedAt: typeof v.publishedAt === 'string' ? v.publishedAt : undefined,
      score: typeof v.finalScore === 'number' ? v.finalScore : undefined,
      tags: Array.isArray(v.aiTags) ? v.aiTags.map((t: any) => t?.tag).filter(Boolean) : [],
      url: /^https?:\/\//.test(v.url ?? '') ? v.url : `https://aihot.news/s/${v.id}`,
    }))
    .filter((v: AihotItem) => v.id && v.title)
}

function decodeRecord(arr: unknown[], raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(raw)) {
    const name = fieldName(arr, key)
    if (name === 'tags' && typeof val === 'number' && Array.isArray(arr[val])) {
      out.tags = (arr[val] as unknown[]).map(item => primitive(arr, item)).filter(v => v != null)
      continue
    }
    if ((name === 'x' || name === 'source') && typeof val === 'number' && isRecord(arr[val])) {
      out[name] = decodeRecord(arr, arr[val] as Record<string, unknown>)
      continue
    }
    if (name === 'score') {
      const resolved = primitive(arr, val)
      out.score = typeof resolved === 'number' ? resolved : undefined
      continue
    }
    out[name] = primitive(arr, val)
  }
  return out
}

function fieldName(arr: unknown[], key: string): string {
  if (key.startsWith('_') && /^\d+$/.test(key.slice(1))) {
    const name = arr[Number(key.slice(1))]
    if (typeof name === 'string')
      return name
  }
  return key
}

function primitive(arr: unknown[], val: unknown): unknown {
  if (val === -5)
    return null
  if (typeof val === 'number' && val >= 0 && val < arr.length) {
    const v = arr[val]
    if (v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
      return v
    return val
  }
  return val
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v != null && !Array.isArray(v)
}

/** 从 `marker"` 起按 JS 字符串转义规则截取并 JSON.parse */
function extractQuotedJsString(html: string, marker: string): string {
  const s = html.indexOf(marker)
  if (s === -1)
    return ''
  let i = s + marker.length
  while (i < html.length && /\s/.test(html[i]))
    i++
  if (html[i] !== '"')
    return ''
  const quoteStart = i
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
  try {
    return JSON.parse(html.slice(quoteStart, i + 1)) as string
  }
  catch {
    return ''
  }
}

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
