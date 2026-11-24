/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-01-20 15:22:39
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-19 10:40:00
 * @Description: Github - 热门仓库
 */
import { fetchJson } from '@/lib/request'
import { errorResponse, successResponse } from '@/lib/response'

import type { HotListItem } from '@/types'

export async function GET() {
  // github.com/trending 在国内（含本机 Docker）经常 TLS 超时；
  // api.github.com 可通，改用「近 7 天新建仓库按 star 排序」作为热门近似
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`created:>${since}`)}&sort=stars&order=desc&per_page=25`
  try {
    const responseBody = await fetchJson<{ items?: GitHubRepo[] }>(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    const result: HotListItem[] = (responseBody.items ?? []).map(repo => ({
      id: repo.full_name,
      title: repo.full_name,
      desc: repo.description || '',
      tip: formatStars(repo.stargazers_count ?? 0),
      url: repo.html_url,
      mobileUrl: repo.html_url,
    }))
    return successResponse(result)
  }
  catch (error) {
    console.error('上游请求失败：', error)
    return errorResponse()
  }
}

interface GitHubRepo {
  full_name: string
  description?: string | null
  html_url: string
  stargazers_count?: number
}

function formatStars(count: number): string {
  if (count < 1000)
    return count.toString()
  if (count < 1_000_000)
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
}
