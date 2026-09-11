/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:20:05
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 上游请求公共工具：统一 UA、超时、缓存、错误日志与自适应抓取间隔
 */

import { createHash } from 'node:crypto'

import { API_CACHE_SECONDS } from '@/enums/response'

/** Chrome 桌面端 UA（多数上游 JSON API 的反爬要求） */
export const UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'

/** 默认请求超时（ms）：上游挂死时避免请求永久挂起 */
export const REQUEST_TIMEOUT = 15_000

/**
 * 自适应抓取间隔（AIMD，思路来自 newsnow 的"按更新频率动态调整抓取"）：
 * 每次成功响应与上次内容哈希对比——内容变化则下次缓存窗口减半（更勤快），
 * 未变化则放大 1.5 倍（省着抓），夹在 [MIN, MAX] 之间。
 * 更新活跃的源（财经快讯）会自动收敛到短间隔，更新缓慢的源（报刊）自动放宽。
 */
const ADAPTIVE_MIN_SECONDS = 120
const ADAPTIVE_MAX_SECONDS = 3600

interface IntervalState {
  interval: number
  hash: string
}

const intervalTracker = new Map<string, IntervalState>()

interface RequestInitLike {
  headers?: Record<string, string>
  signal?: AbortSignal
  /** 显式缓存策略（传了则跳过默认 revalidate） */
  cache?: RequestCache
  /** 显式 Next.js 缓存配置（传了则跳过默认 revalidate） */
  next?: { revalidate?: number }
  [key: string]: unknown
}

/** 供调试/观测：各上游当前的自适应间隔（秒） */
export function adaptiveSnapshot(): Record<string, number> {
  return Object.fromEntries([...intervalTracker.entries()].map(([url, s]) => [url, s.interval]))
}

/**
 * 统一 GET 请求并解析 JSON
 * - 默认携带 Chrome UA（可被 init.headers 覆盖，传空字符串可移除）
 * - 默认 15s 超时（可被 init.signal 覆盖）
 * - 默认缓存 API_CACHE_SECONDS 秒（可被 init.cache / init.next 覆盖）
 * - 非 2xx 直接抛错（错误信息含状态码与 URL）
 */
export async function fetchJson<T = any>(url: string, init: RequestInitLike = {}): Promise<T> {
  const { cache, next, headers, signal, ...restInit } = init
  const response = await fetch(url, {
    ...restInit,
    ...(cache ? { cache } : {}),
    // 默认走自适应 revalidate；调用方显式传 cache / next 时尊重调用方
    ...(next ?? (cache ? {} : { next: { revalidate: adaptiveRevalidate(url) } })),
    signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT),
    headers: buildHeaders(headers),
  })
  if (!response.ok) {
    throw new Error(`上游请求失败：${response.status} ${url}`)
  }
  const result = await response.json() as T
  trackAdaptive(url, JSON.stringify(result))
  return result
}

/**
 * 统一 GET 请求并返回文本（用于 cheerio / 正则解析的 HTML 页面）
 */
export async function fetchText(url: string, init: RequestInitLike = {}): Promise<string> {
  const { cache, next, headers, signal, ...restInit } = init
  const response = await fetch(url, {
    ...restInit,
    ...(cache ? { cache } : {}),
    // 默认走自适应 revalidate；调用方显式传 cache / next 时尊重调用方
    ...(next ?? (cache ? {} : { next: { revalidate: adaptiveRevalidate(url) } })),
    signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT),
    headers: buildHeaders(headers),
  })
  if (!response.ok) {
    throw new Error(`上游请求失败：${response.status} ${url}`)
  }
  const text = await response.text()
  trackAdaptive(url, text)
  return text
}

/** 易变参数：剥离后生成稳定的跟踪键（时间戳/签名类参数会破坏自适应收敛） */
const VOLATILE_PARAMS = new Set(['last_time', 'sign', 't', '_', 'created_at', 'timestamp', 'tmp'])

/** 当前 URL 的自适应缓存窗口（未观察过时用全局默认值） */
function adaptiveRevalidate(url: string): number {
  return intervalTracker.get(trackerKey(url))?.interval ?? API_CACHE_SECONDS
}

/**
 * 组装请求头：
 * - 未显式设置 User-Agent 时注入默认 Chrome UA
 * - 显式传 'User-Agent': '' 表示不发送 UA 头（个别上游对桌面 UA 返回反爬页）
 */
function buildHeaders(initHeaders?: Record<string, string>) {
  const headers = new Headers()
  let hasExplicitUA = false

  for (const [key, value] of Object.entries(initHeaders ?? {})) {
    if (key.toLowerCase() === 'user-agent') {
      hasExplicitUA = true
      if (value)
        headers.set(key, value)
    }
    else {
      headers.set(key, value)
    }
  }

  if (!hasExplicitUA) {
    headers.set('User-Agent', UA_CHROME)
  }

  return headers
}

/** 响应内容记账：更新该 URL 的自适应间隔（键为剥离易变参数后的规范化 URL） */
function trackAdaptive(url: string, body: string): void {
  const hash = createHash('md5').update(body).digest('hex')
  const key = trackerKey(url)
  const state = intervalTracker.get(key)
  if (!state) {
    intervalTracker.set(key, { interval: API_CACHE_SECONDS, hash })
    return
  }
  if (hash === state.hash) {
    // 内容未变：放宽抓取节奏
    state.interval = Math.min(ADAPTIVE_MAX_SECONDS, Math.round(state.interval * 1.5))
  }
  else {
    // 内容有更新：收紧抓取节奏
    state.interval = Math.max(ADAPTIVE_MIN_SECONDS, Math.round(state.interval / 2))
    state.hash = hash
  }
}

function trackerKey(url: string): string {
  try {
    const u = new URL(url)
    const params = [...u.searchParams.entries()].filter(([k]) => !VOLATILE_PARAMS.has(k)).sort()
    return `${u.origin + u.pathname}?${params.map(([k, v]) => `${k}=${v}`).join('&')}`
  }
  catch {
    return url
  }
}
