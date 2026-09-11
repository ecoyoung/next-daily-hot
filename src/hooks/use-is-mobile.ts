/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2025-11-20 14:40:51
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 判断是否移动端
 */
import { useState } from 'react'

export function useIsMobile() {
  // Initialize state synchronously if possible, avoiding setState in effect
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  })

  return isMobile
}
