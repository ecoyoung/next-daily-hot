#!/bin/sh
# 一键部署：构建镜像 → 启动应用容器 → 挂载 Cloudflare 隧道
# token 存放在 .tunnel-token 文件（勿提交/勿外传）
set -e
cd "$(dirname "$0")"
TOKEN=$(cat .tunnel-token)
docker build -t news-platform .
docker rm -f news-platform cf-tunnel 2>/dev/null || true
docker run -d --name news-platform --restart unless-stopped -p 3002:3000 news-platform
docker run -d --name cf-tunnel --restart unless-stopped \
  --network container:news-platform \
  cloudflare/cloudflared:latest tunnel --no-autoupdate --protocol http2 run --token "$TOKEN"
sleep 8
echo "应用:   http://localhost:3002"
echo "隧道:   $(docker logs cf-tunnel 2>&1 | grep -c 'Registered tunnel connection') 条连接"
