/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-11-24 11:20:00
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-24 11:20:00
 * @Description: 小红书 H5 热榜签名（旧版 SDK，公开榜单接口仍接受）
 */
import { createHash } from 'node:crypto'

const XHS_B64 = 'ZmserbBoHQtNP+wOcza/LpngG8yJq42KWYj0DSfdikx3VT16IlUAFM97hECvuRX5'
const STD_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const OLD_ALPHA = 'A4NjFqYu5wPHsO0XTdDgMa2r1ZQocVte9UJBvk6/7=yRnhISGKblCWi+LpfE8xzm3'

const HU_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit++)
    value = (value & 1) ? (value >>> 1) ^ 0xEDB88320 : value >>> 1
  return value >>> 0
})

export interface XiaohongshuSign {
  xs: string
  xt: string
  common: string
}

/** 小红书 H5 热榜路径 */
export const XHS_HOT_PATH = '/api/sns/mobile/v1/search/hot_list_h5'

export function xiaohongshuHotUrl(): string {
  return `https://edith.xiaohongshu.com${XHS_HOT_PATH}`
}

/** 生成当前请求的 x-s / x-t / x-s-common */
export function signXiaohongshuV1(path: string): XiaohongshuSign {
  const ts = Date.now()
  const xs = encodeMd5(createHash('md5').update(`${ts}test${path}`).digest('hex'))
  const xt = String(ts)
  const payload = {
    s0: 5,
    s1: '',
    x0: '1',
    x1: '3.2.0',
    x2: 'Windows',
    x3: 'xhs-pc-web',
    x4: '2.3.1',
    x5: '',
    x6: xt,
    x7: xs,
    x8: '',
    x9: crc32Hu(xt + xs),
    x10: 1,
  }
  return {
    xs,
    xt,
    common: toXhsBase64(Buffer.from(JSON.stringify(payload))),
  }
}

function toXhsBase64(data: Buffer): string {
  const standard = data.toString('base64')
  let encoded = ''
  for (const char of standard) {
    const index = STD_B64.indexOf(char)
    encoded += index >= 0 ? XHS_B64[index] : char
  }
  return encoded
}

function crc32Hu(text: string): number {
  let value = 0xFFFFFFFF
  for (const char of text)
    value = (HU_TABLE[(value ^ char.charCodeAt(0)) & 0xFF] ^ (value >>> 8)) >>> 0
  const result = (0xFFFFFFFF ^ value ^ 0xEDB88320) >>> 0
  return result < 0x80000000 ? result : result - 0x100000000
}

/** 32 位 MD5 hex 编成 44 位旧版 X-s */
function encodeMd5(md5hex: string): string {
  let encoded = ''
  for (let index = 0; index < 32; index += 3) {
    const first = md5hex.charCodeAt(index)
    const second = index + 1 < 32 ? md5hex.charCodeAt(index + 1) : 0
    const third = index + 2 < 32 ? md5hex.charCodeAt(index + 2) : 0
    const mixed = ((first & 3) << 4) | (second >> 4)
    let low = ((15 & second) << 2) | (third >> 6)
    const high = first >> 2
    let tail = third ? third & 63 : 64
    if (!second)
      low = tail = 64
    encoded += OLD_ALPHA[high] + OLD_ALPHA[mixed] + OLD_ALPHA[low] + OLD_ALPHA[tail]
  }
  return encoded
}
