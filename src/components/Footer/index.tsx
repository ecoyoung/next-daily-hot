/*
 * @Author: Ethan Zhou <ecoyoung918@gmail.com>
 * @Date: 2025-11-20 09:43:44
 * @LastEditors: Ethan Zhou <ecoyoung918@gmail.com>
 * @LastEditTime: 2026-09-11 14:20:05
 * @Description: 底部版权
 */
'use client'
import {
  Chip,
  cn,
  Description,
  Separator,
} from '@heroui/react'
import Image from 'next/image'
import { useState } from 'react'

export default function Footer() {
  // 版权年份：渲染期间固定（state 惰性初始化，避免渲染期调用 new Date 导致不纯）
  const [year] = useState(() => new Date().getFullYear())
  return (
    <footer className="shrink-0 mx-auto w-full container! px-6 py-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
      <div className="flex items-center gap-3 justify-self-center sm:justify-self-start">
        <div className="flex items-center gap-2">
          <div className="size-5 relative">
            <Image alt="Logo" fill src="/logo.svg" />
          </div>
          <span className="text-sm font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </span>
        </div>
        <Separator orientation="vertical" className="h-4 self-center" />
        <Chip
          color="success"
          size="sm"
          variant="soft"
          className="px-2 py-0.5 text-[10px]"
        >
          <div
            data-slot="status-indicator"
            className={cn(
              'relative flex size-2 shrink-0 rounded-full bg-success',
              'before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-inherit',
              'after:absolute after:inset-0.5 after:rounded-full after:bg-inherit',
            )}
          />
          <Chip.Label>服务状态正常</Chip.Label>
        </Chip>
      </div>
      <Description className="justify-self-center sm:col-span-2 sm:text-right">
        &copy;
        {' '}
        {year}
        {' '}
        · 资讯信息来源于相关平台，版权归原作者及发布平台所有
      </Description>
    </footer>
  )
}
