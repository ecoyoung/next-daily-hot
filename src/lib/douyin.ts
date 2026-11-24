/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-11-19 11:00:00
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-11-19 11:00:00
 * @Description: 抖音热点榜子分类（sentence_tag 千位段，来自公开热搜接口）
 */

/** 卡片内筛选 key（all = 不过滤） */
export type DouyinBoardKey
  = | 'all'
    | 'challenge'
    | 'entertainment'
    | 'society'
    | 'sports'
    | 'finance'
    | 'life'
    | 'travel'
    | 'game'
    | 'fashion'
    | 'other'

export interface DouyinBoardTab {
  key: DouyinBoardKey
  label: string
}

/**
 * 抖音 App / 网页热榜顶部分类（千位段）：
 * 1xxx 挑战/热点挑战  2xxx 文娱影视  3xxx 社会时政
 * 5xxx 体育  7xxx 财经  9xxx 生活美食  10xxx 旅游
 * 12xxx 游戏电竞  16xxx 时尚美妆  其余归其他
 */
export const DOUYIN_BOARD_TABS: DouyinBoardTab[] = [
  { key: 'all', label: '总榜' },
  { key: 'entertainment', label: '文娱影视' },
  { key: 'challenge', label: '挑战' },
  { key: 'society', label: '社会' },
  { key: 'sports', label: '体育' },
  { key: 'finance', label: '财经' },
  { key: 'life', label: '生活' },
  { key: 'travel', label: '旅游' },
  { key: 'game', label: '游戏' },
  { key: 'fashion', label: '时尚' },
  { key: 'other', label: '其他' },
]

const BOARD_BY_THOUSAND: Record<number, DouyinBoardKey> = {
  1: 'challenge',
  2: 'entertainment',
  3: 'society',
  4: 'society',
  5: 'sports',
  7: 'finance',
  9: 'life',
  10: 'travel',
  12: 'game',
  16: 'fashion',
}

const TAB_LABEL = Object.fromEntries(DOUYIN_BOARD_TABS.map(t => [t.key, t.label])) as Record<DouyinBoardKey, string>

/** sentence_tag → 子分类（未知编码归 other） */
export function douyinBoardFromTag(tag?: number): DouyinBoardKey {
  if (!tag || tag <= 0)
    return 'other'
  return BOARD_BY_THOUSAND[Math.floor(tag / 1000)] ?? 'other'
}

export function douyinBoardLabel(key: DouyinBoardKey): string {
  return TAB_LABEL[key] ?? '其他'
}

/** 热搜角标：0 无 / 1 新 / 3 热 / 5 沸 / 8 直播 / 9 挑战 / 17 爆 */
export function douyinMarkLabel(mark?: number): string | undefined {
  switch (mark) {
    case 1:
      return '新'
    case 3:
      return '热'
    case 5:
      return '沸'
    case 8:
      return '播'
    case 9:
      return '挑战'
    case 17:
      return '爆'
    default:
      return undefined
  }
}
