/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:21:42
 * @Description:
 */

import { Star } from '@gravity-ui/icons'

import type { ReactNode } from 'react'

/**
 * @description: 热榜子项配置（唯一数据源）
 */
const hotItemsConfig = {
  'WEIBO': { value: 'weibo', label: '微博', tip: '热搜榜' },
  'XIAOHONGSHU': { value: 'xiaohongshu', label: '小红书', tip: '实时热榜' },
  'BILIBILI': { value: 'bilibili', label: '哔哩哔哩', tip: '热搜榜' },
  'DOUYIN': { value: 'douyin', label: '抖音', tip: '热点榜' },
  'TOUTIAO': { value: 'toutiao', label: '今日头条', tip: '热榜' },
  'ZHIHU': { value: 'zhihu', label: '知乎', tip: '热榜' },
  'BAIDU': { value: 'baidu', label: '百度', tip: '热搜榜' },
  'BAIDU_TIEBA': { value: 'baidutieba', label: '百度贴吧', tip: '热议榜' },
  'QQ': { value: 'qq', label: '腾讯新闻', tip: '热点榜' },
  'HUPU': { value: 'hupu', label: '虎扑', tip: '步行街热帖', suffix: '亮' },
  'JUEJIN': { value: 'juejin', label: '稀土掘金', tip: '热榜' },
  'GITHUB_TRENDING': { value: 'github-trending', label: 'Github', tip: '热门仓库', suffix: <Star width={12} /> },
  'HELLO_GITHUB': { value: 'hello-github', label: 'HelloGithub', tip: '精选' },
  'CSDN': { value: 'csdn', label: 'CSDN', tip: '热榜' },
  'NETEASE': { value: 'netease', label: '网易新闻', tip: '热榜' },
  'QUARK': { value: 'quark', label: '夸克', tip: '今日热点' },
  'THEPAPER': { value: 'thepaper', label: '澎湃新闻', tip: '热榜' },
  'KUAISHOU': { value: 'kuaishou', label: '快手', tip: '热榜' },
  'DONGCHEDI': { value: 'dongchedi', label: '懂车帝', tip: '今日资讯' },
  'HISTORY_TODAY': { value: 'history-today', label: '百度百科', tip: '历史上的今天', suffix: '年' },
  'WEREAD': { value: 'weread', label: '微信读书', tip: '飙升榜' },
  'DOUBAN_MOVIC': { value: 'douban-movic', label: '豆瓣电影', tip: '新片榜' },
  'NETEASE_MUSIC': { value: 'netease-music', label: '网易云音乐', tip: '热歌榜' },
  'WOSHIPM': { value: 'woshipm', label: '人人都是产品经理', tip: '热榜' },
  '36KR': { value: '36kr', label: '36氪', tip: '24小时热榜' },
  'HUXIU': { value: 'huxiu', label: '虎嗅', tip: '最新资讯' },
  'ZHIHU_DAILY': { value: 'zhihu-daily', label: '知乎日报', tip: '推荐榜' },
  'IFANR': { value: 'ifanr', label: '爱范儿', tip: '快讯' },
  'ITHOME': { value: 'ithome', label: 'IT之家', tip: '热榜' },
  'ELLE': { value: 'elle', label: 'ELLE', tip: '美容速报' },
  'HZPB': { value: 'hzpb', label: '化妆品报', tip: '最新资讯' },
  'JUMEILI': { value: 'jumeili', label: '聚美丽', tip: '最新资讯' },
  'AIHOT': { value: 'aihot', label: 'AIHOT', tip: 'AI 产品' },
  'WWD': { value: 'wwd', label: 'WWD', tip: '美妆特辑' },
  'PREMIUM_BEAUTY_NEWS': { value: 'premiumbeautynews', label: 'PBN', tip: '美妆产业' },
  'COSMETICS_BUSINESS': { value: 'cosmeticsbusiness', label: 'CosBiz', tip: '美妆产业' },
  'IQINGYAN': { value: 'iqingyan', label: '青眼', tip: '美妆产业' },
  'V2EX': { value: 'v2ex', label: 'V2EX', tip: '热门' },
  'ZAOBAO': { value: 'zaobao', label: '联合早报', tip: '实时快讯', timeline: true },
  'COOLAPK': { value: 'coolapk', label: '酷安', tip: '今日热门' },
  'MKTNEWS': { value: 'mktnews', label: 'MKTNews', tip: '快讯', timeline: true },
  'WALLSTREETCN': { value: 'wallstreetcn', label: '华尔街见闻', tip: '快讯', timeline: true },
  'DONGQIUDI': { value: 'dongqiudi', label: '懂球帝', tip: '热门' },
  'SPUTNIKNEWSCN': { value: 'sputniknewscn', label: '卫星社', tip: '要闻', timeline: true },
  'CANKAOXIAOXI': { value: 'cankaoxiaoxi', label: '参考消息', tip: '要闻', timeline: true },
  'CLS': { value: 'cls', label: '财联社', tip: '电报', timeline: true },
  'XUEQIU': { value: 'xueqiu', label: '雪球', tip: '热股' },
  'GELONGHUI': { value: 'gelonghui', label: '格隆汇', tip: '资讯' },
  'FASTBULL': { value: 'fastbull', label: '法布财经', tip: '快讯', timeline: true },
  'SOLIDOT': { value: 'solidot', label: 'Solidot', tip: '资讯' },
  'HACKERNEWS': { value: 'hackernews', label: 'HackerNews', tip: '热榜' },
  'PRODUCTHUNT': { value: 'producthunt', label: 'ProductHunt', tip: '新品' },
  'JIN10': { value: 'jin10', label: '金十数据', tip: '快讯', timeline: true },
  'NOWCODER': { value: 'nowcoder', label: '牛客', tip: '热榜' },
  'SSPAI': { value: 'sspai', label: '少数派', tip: '热门' },
  'IFENG': { value: 'ifeng', label: '凤凰网', tip: '热点' },
  'CHONGBULUO': { value: 'chongbuluo', label: '虫部落', tip: '热帖' },
  'FREEBUF': { value: 'freebuf', label: 'FreeBuf', tip: '安全资讯' },
  'QQVIDEO': { value: 'qqvideo', label: '腾讯视频', tip: '剧集热搜' },
  'IQIYI': { value: 'iqiyi', label: '爱奇艺', tip: '热播榜' },
} as const

/** 热榜子项（与 enum-plus 的 items 形状保持一致） */
export interface HotItem {
  key: HotKey
  value: HotValue
  label: string
  tip: string
  suffix?: ReactNode
  /** 时间线呈现（快讯流类源：按发布时间排列，无榜单序号语义） */
  timeline?: boolean
  raw: HotRaw
}

/** 热榜 key 类型 */
export type HotKey = keyof typeof hotItemsConfig
/** 热榜项原始配置 */
export type HotRaw = (typeof hotItemsConfig)[HotKey] & { timeline?: boolean }
/** 热榜 value 类型 */
export type HotValue = (typeof hotItemsConfig)[HotKey]['value']

const hotItems: HotItem[] = (Object.entries(hotItemsConfig) as [HotKey, HotRaw][]).map(([key, raw]) => ({
  key,
  value: raw.value,
  label: raw.label,
  tip: raw.tip,
  suffix: 'suffix' in raw ? raw.suffix : undefined,
  timeline: 'timeline' in raw ? raw.timeline : undefined,
  raw,
}))

const hotValues: HotValue[] = hotItems.map(item => item.value)

const hotRawMap = Object.fromEntries(
  hotItems.map(item => [item.value, item.raw]),
) as Record<HotValue, HotRaw>

export const HOT_ITEMS = {
  items: hotItems,
  values: hotValues,
  /** 根据 value 获取原始配置 */
  raw: (value: HotValue): HotRaw | undefined => hotRawMap[value],
}
