/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-11-19 11:20:00
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-19 11:20:00
 * @Description: 微博热搜子榜（App searchall filter_type，与手机热搜顶栏一致）
 */

/** 卡片内筛选 key（与 App 顶栏 filter_type 对齐） */
export type WeiboBoardKey = 'realtimehot' | 'fun' | 'social' | 'lifenav'

export interface WeiboBoardTab {
  key: WeiboBoardKey
  label: string
}

/** 手机微博热搜顶栏：热搜 / 文娱 / 社会 / 生活（同城依赖定位，跳过） */
export const WEIBO_BOARD_TABS: WeiboBoardTab[] = [
  { key: 'realtimehot', label: '热搜' },
  { key: 'fun', label: '文娱' },
  { key: 'social', label: '社会' },
  { key: 'lifenav', label: '生活' },
]

const TAB_LABEL = Object.fromEntries(WEIBO_BOARD_TABS.map(t => [t.key, t.label])) as Record<WeiboBoardKey, string>

export function weiboBoardLabel(key: WeiboBoardKey): string {
  return TAB_LABEL[key] ?? key
}

export function weiboSearchallUrl(filterType: WeiboBoardKey): string {
  const containerid = `106003type=25&t=3&disable_hot=1&filter_type=${filterType}`
  return `https://api.weibo.cn/2/guest/searchall?sid=v_weibohot&containerid=${encodeURIComponent(containerid)}`
}
