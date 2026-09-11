/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:21:42
 * @Description: 榜单分类配置（罗盘选择器数据源）
 */

/** 分类展示项 */
export interface CategoryItem {
  key: CategoryKey
  label: string
  icon: string
}

/** 分类 key（all 为虚拟全选项，不参与归属映射） */
export type CategoryKey
  = | 'all'
    | 'general'
    | 'finance'
    | 'social'
    | 'tech'
    | 'business'
    | 'beauty'
    | 'lifestyle'

/** 罗盘固定顺序（首尾循环） */
export const CATEGORY_ORDER: CategoryItem[] = [
  { key: 'all', label: '全部', icon: '🧭' },
  { key: 'general', label: '综合热点', icon: '🔥' },
  { key: 'finance', label: '财经行情', icon: '📈' },
  { key: 'social', label: '社区社交', icon: '💬' },
  { key: 'tech', label: '科技数码', icon: '💻' },
  { key: 'business', label: '商业创投', icon: '💼' },
  { key: 'beauty', label: '美妆产业', icon: '💄' },
  { key: 'lifestyle', label: '文娱生活', icon: '🎬' },
]

const categoryMap: Record<CategoryKey, string> = {
  all: '全部',
  general: '综合热点',
  finance: '财经行情',
  social: '社区社交',
  tech: '科技数码',
  business: '商业创投',
  beauty: '美妆产业',
  lifestyle: '文娱生活',
}

/** 分类 key → 展示名 */
export const CATEGORY_LABEL = (key: CategoryKey): string => categoryMap[key] ?? key

/**
 * 榜单源 → 分类列表（多标签）：
 * 微博/知乎同时具备全民热搜与社区讨论两种属性，双归属
 */
export const SOURCE_CATEGORIES = {
  'weibo': ['general', 'social'],
  'xiaohongshu': ['social'],
  'bilibili': ['social'],
  'douyin': ['social'],
  'toutiao': ['general'],
  'zhihu': ['general', 'social'],
  'baidu': ['general'],
  'baidutieba': ['social'],
  'qq': ['general'],
  'hupu': ['social'],
  'juejin': ['tech'],
  'github-trending': ['tech'],
  'hello-github': ['tech'],
  'csdn': ['tech'],
  'netease': ['general'],
  'quark': ['general'],
  'thepaper': ['general'],
  'kuaishou': ['social'],
  'dongchedi': ['tech'],
  'history-today': ['lifestyle'],
  'weread': ['lifestyle'],
  'douban-movic': ['lifestyle'],
  'netease-music': ['lifestyle'],
  'woshipm': ['business'],
  '36kr': ['business'],
  'huxiu': ['business'],
  'zhihu-daily': ['general'],
  'ifanr': ['tech'],
  'ithome': ['tech'],
  'elle': ['beauty'],
  'hzpb': ['beauty'],
  'jumeili': ['beauty'],
  'aihot': ['tech'],
  'wwd': ['beauty'],
  'premiumbeautynews': ['beauty'],
  'cosmeticsbusiness': ['beauty'],
  'iqingyan': ['beauty'],
  'cls': ['finance'],
  'wallstreetcn': ['finance'],
  'xueqiu': ['finance'],
  'jin10': ['finance'],
  'gelonghui': ['finance'],
  'fastbull': ['finance'],
  'mktnews': ['finance'],
  'v2ex': ['tech'],
  'coolapk': ['tech'],
  'solidot': ['tech'],
  'hackernews': ['tech'],
  'producthunt': ['tech'],
  'nowcoder': ['tech'],
  'sspai': ['tech'],
  'freebuf': ['tech'],
  'chongbuluo': ['tech'],
  'cankaoxiaoxi': ['general'],
  'sputniknewscn': ['general'],
  'ifeng': ['general'],
  'zaobao': ['general'],
  'qqvideo': ['lifestyle'],
  'iqiyi': ['lifestyle'],
  'dongqiudi': ['lifestyle'],
} as const satisfies Record<string, readonly CategoryKey[]>

/** 源是否属于指定分类（all 视为全选） */
export function isInCategory(value: string, category: CategoryKey): boolean {
  if (category === 'all')
    return true
  return (SOURCE_CATEGORIES as Record<string, readonly CategoryKey[]>)[value]?.includes(category) ?? false
}
