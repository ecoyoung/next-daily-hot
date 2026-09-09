import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker 部署：standalone 产物只含运行所需文件，镜像无需 node_modules 全量
  output: 'standalone',
  // Next.js 16 + Turbopack 默认自动 tree-shake barrel 导入（如 @heroui/react），无需额外配置
  images: {
    unoptimized: true, // 禁用 Vercel 图片优化
  },
}

export default nextConfig
