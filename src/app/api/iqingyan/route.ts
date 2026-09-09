/*
 * @Description: 青眼 - 美妆产业资讯
 */
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

/** 上游（昆仑 CDN）频繁间歇性故障：最后一次成功数据落盘，进程/容器重启后仍可兜底 */
const FALLBACK_FILE = join(tmpdir(), 'iqingyan-last-good.json')
let lastGoodResult: HotListItem[] | null = null
/** 熔断：最近一次失败时间，5 分钟内跳过上游直接走兜底，避免每次请求白等超时 */
const BREAKER_MS = 5 * 60 * 1000
let lastFailAt = 0

export async function GET() {
  // 官方接口（首页资讯流 AJAX 端点，每页 10 条，取前两页）
  // 不带随机参数：URL 稳定才能命中 Next 数据缓存，上游短暂故障时仍可返回上次缓存
  const url = (page: number) => `https://www.iqingyan.cn/handlers/IndexHandler.ashx?PageNum=${page}`
  const breakerOpen = Date.now() - lastFailAt < BREAKER_MS
  if (breakerOpen && (lastGoodResult?.length || (await readFallback())?.length)) {
    return successResponse(lastGoodResult ?? (await readFallback())!)
  }
  try {
    const headers = {
      'Referer': 'https://www.iqingyan.cn/',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
    }
    const [page1, page2] = await Promise.all([
      fetchJson<any[]>(url(1), { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }),
      fetchJson<any[]>(url(2), { headers, signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }).catch(() => [] as any[]),
    ])
    const result: HotListItem[] = [...page1, ...page2].map((v) => {
      const link = `https://www.iqingyan.cn/Details.aspx?id=${v.Id}&type=${v.article_Type ?? 1}`
      return {
        id: v.Id,
        title: (v.Title ?? '').trim(),
        desc: contentHead(v.Content ?? ''),
        tip: v.CreatedTime ? wcfDateToMonthDay(v.CreatedTime) : undefined,
        label: v.article_Source || undefined,
        url: link,
        mobileUrl: link,
      }
    }).filter(v => v.title)
    if (result.length) {
      lastGoodResult = result
      persistFallback(result)
    }
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    lastFailAt = Date.now()
    // 上游故障时返回最后成功数据（内存 → 落盘文件），比报错占位体验好
    if (lastGoodResult?.length)
      return successResponse(lastGoodResult)
    const persisted = await readFallback()
    if (persisted?.length)
      return successResponse(persisted)
    return errorResponse()
  }
}

/** 正文 HTML 去标签后取开头做摘要 */
function contentHead(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;|&rdquo;|&hellip;/g, m => ({ '&ldquo;': '“', '&rdquo;': '”', '&hellip;': '…' })[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

function persistFallback(items: HotListItem[]) {
  void writeFile(FALLBACK_FILE, JSON.stringify(items), 'utf8').catch(() => {})
}

async function readFallback(): Promise<HotListItem[] | null> {
  try {
    const cached = JSON.parse(await readFile(FALLBACK_FILE, 'utf8')) as HotListItem[]
    return Array.isArray(cached) && cached.length ? cached : null
  }
  catch {
    return null
  }
}

/** WCF 日期格式 /Date(1546593754000+0800)/ → MM-DD */
function wcfDateToMonthDay(value: string): string | undefined {
  const ms = Number.parseInt(value.slice(6, 19), 10)
  if (Number.isNaN(ms))
    return undefined
  const d = new Date(ms + 8 * 60 * 60 * 1000)
  return d.toISOString().slice(5, 10)
}
