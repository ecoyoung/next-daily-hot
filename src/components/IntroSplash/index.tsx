/*
 * @description: 入场启动屏——每个会话首次进入播放一次翻牌动画（sessionStorage 门控，刷新不再展示）
 */
'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import SplitFlapText from '@/components/SplitFlapText/SplitFlapText'

const SPLASH_SESSION_KEY = 'intro-splash-shown'

function IntroSplash() {
  // 本组件只挂载于页面 mounted 之后（纯客户端），惰性初始化读 sessionStorage 无水合问题。
  // 决策放在渲染期而不是 effect 里：StrictMode 双执行 effect 时标记已落库，effect 版会把 show 覆盖成 hide
  const [state, setState] = useState<'show' | 'hide'>(() =>
    (typeof window !== 'undefined' && sessionStorage.getItem(SPLASH_SESSION_KEY)) ? 'hide' : 'show')
  const [subtitleIn, setSubtitleIn] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 首次展示后落标记（幂等，双执行无害）
  useEffect(() => {
    if (state === 'show')
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1')
  }, [state])

  // 翻牌全部落定后：先展示主题语，短暂停留再收起启动屏
  const handleSettled = useCallback(() => {
    setSubtitleIn(true)
    dismissTimerRef.current = setTimeout(setState, 1100, 'hide')
  }, [])

  // 兜底：极端情况下动画未回调也要能退出
  useEffect(() => {
    if (state !== 'show')
      return
    const failsafe = setTimeout(setState, 6000, 'hide')
    return () => {
      clearTimeout(failsafe)
      clearTimeout(dismissTimerRef.current)
    }
  }, [state])

  return (
    <AnimatePresence>
      {state === 'show' && (
        <motion.div
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          initial={{ opacity: 1 }}
          onClick={() => setState('hide')}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background cursor-pointer"
        >
          <SplitFlapText
            charset="alphanumeric"
            cjk
            flipsPerChar={10}
            fontSize={64}
            stagger={0.09}
            text={process.env.NEXT_PUBLIC_APP_NAME ?? '资讯平台'}
            tileColor="#1758A9"
            onSettled={handleSettled}
          />
          <motion.p
            animate={{ opacity: subtitleIn ? 1 : 0, y: subtitleIn ? 0 : 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-sm text-muted tracking-widest"
          >
            {process.env.NEXT_PUBLIC_APP_DESC}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default IntroSplash
