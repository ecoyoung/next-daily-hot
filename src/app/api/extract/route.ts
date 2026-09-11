import { Buffer } from 'node:buffer'
import { lookup } from 'node:dns/promises'

/*
 * @Description: 正文提取（fetch_article）——供 agent/LLM 下钻阅读原文
 * 服务端抓取任意文章 URL，Readability 抽取正文输出纯文本
 */
import { Readability } from '@mozilla/readability'
import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'

import { UA_CHROME } from '@/lib/request'

const MAX_BYTES = 3 * 1024 * 1024
const MAX_TEXT_CHARS = 4000
const EXTRACT_REVALIDATE = 3600

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get('url')
  if (!target)
    return Response.json({ code: 500, msg: '缺少 url 参数', timestamp: Date.now() })
  try {
    const url = await assertPublicHttpUrl(target)
    const response = await fetch(url, {
      headers: {
        'User-Agent': UA_CHROME,
        'Referer': url.origin,
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: EXTRACT_REVALIDATE },
    })
    if (!response.ok)
      throw new Error(`上游请求失败：${response.status}`)

    const buf = Buffer.from(await response.arrayBuffer())
    if (buf.byteLength > MAX_BYTES)
      throw new Error('页面体积超过 3MB 上限')
    const html = decodeBody(buf, response.headers.get('content-type') ?? '')

    // Readability 主路径（Firefox 阅读视图算法）
    const dom = new JSDOM(html, { url: url.toString(), runScripts: 'outside-only' })
    let parsed = new Readability(dom.window.document).parse()

    if (!parsed?.textContent || parsed.textContent.trim().length < 60) {
      const fb = fallbackExtract(html)
      parsed = { ...parsed, title: parsed?.title || fb.title, textContent: fb.text } as NonNullable<typeof parsed>
    }

    const text = (parsed.textContent ?? '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
      .slice(0, MAX_TEXT_CHARS)

    return Response.json({
      code: 200,
      msg: '请求成功',
      data: {
        url: url.toString(),
        title: parsed.title?.trim() || '',
        siteName: parsed.siteName || new URL(url).hostname,
        byline: parsed.byline || undefined,
        excerpt: parsed.excerpt?.trim() || undefined,
        text,
        length: text.length,
        truncated: (parsed.textContent ?? '').trim().length > MAX_TEXT_CHARS,
      },
      timestamp: Date.now(),
    })
  }
  catch (error) {
    console.error('正文提取失败：', error)
    return Response.json({
      code: 500,
      msg: error instanceof Error ? error.message : '正文提取失败',
      timestamp: Date.now(),
    })
  }
}

/** URL 合法性校验：仅 http/https 且禁止解析到内网 */
async function assertPublicHttpUrl(raw: string): Promise<URL> {
  const url = new URL(raw)
  if (!/^https?:$/.test(url.protocol))
    throw new Error('仅支持 http/https 链接')
  const records = await lookup(url.hostname, { all: true })
  if (records.some(r => isPrivateIp(r.address)))
    throw new Error('禁止访问内网地址')
  return url
}

/** 从响应头或 HTML meta 嗅探字符集，返回解码后的文本 */
function decodeBody(buf: Buffer, contentType: string): string {
  let charset = contentType.match(/charset=([\w-]+)/i)?.[1]
  if (!charset) {
    // meta 嗅探只看前 2KB（latin1 解码保证字节对齐）
    const head = buf.subarray(0, 2048).toString('latin1')
    charset = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
  }
  try {
    // gb2312/gbk 用 gb18030 超集解码；其余交给 TextDecoder，不识别则回退 utf-8
    const decoder = new TextDecoder(charset?.toLowerCase() === 'gb2312' || charset?.toLowerCase() === 'gbk' ? 'gb18030' : (charset || 'utf-8'))
    return decoder.decode(buf)
  }
  catch {
    return buf.toString('utf-8')
  }
}

/** Readability 失败时的兜底：启发式取最长的 <p> 文本簇 */
function fallbackExtract(html: string): { title: string, text: string } {
  const $ = cheerio.load(html)
  $('script,style,nav,footer,header,aside,iframe').remove()
  const title = $('title').text().trim()
  const paragraphs = $('p')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(t => t.length > 30)
  return { title, text: paragraphs.join('\n') }
}

/** 私网/回环地址判定（SSRF 防护） */
function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const a = Number(v4[1])
    const b = Number(v4[2])
    if (a === 0 || a === 10 || a === 127)
      return true
    if (a === 172 && b >= 16 && b <= 31)
      return true
    if (a === 192 && b === 168)
      return true
    if (a === 169 && b === 254)
      return true
    if (a === 100 && b >= 64 && b <= 127)
      return true
    return false
  }
  const v6 = ip.toLowerCase()
  if (v6 === '::' || v6 === '::1')
    return true
  if (v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80'))
    return true
  if (v6.startsWith('::ffff:'))
    return isPrivateIp(v6.slice(7))
  return false
}
