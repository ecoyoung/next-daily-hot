/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2026-09-11 14:21:42
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:21:42
 * @Description:
 */

'use client'

import { useEffect } from 'react'

import { useAppStore } from '@/store/useAppStore'

export default function AppTimeTicker() {
  useEffect(() => {
    const id = setInterval(() => {
      useAppStore.getState().tick()
    }, 60_000) // 1 分钟

    return () => clearInterval(id)
  }, [])

  return null
}
