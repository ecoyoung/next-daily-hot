/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:21:42
 * @Description:
 */

'use client'

import { MotionConfig } from 'motion/react'

import type { ReactNode } from 'react'

/**
 * 全局 motion 配置：
 * reducedMotion="user" —— 尊重系统「减少动态效果」设置，用户开启后自动禁用动画
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
