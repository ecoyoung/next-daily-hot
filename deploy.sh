#!/bin/sh
# 一键部署：优先重建镜像；Docker Hub 不可达时自动回退为「本机构建 + 容器热替换」
# token 存放在 .tunnel-token 文件（勿提交/勿外传）
set -e
cd "$(dirname "$0")"
TOKEN=$(cat .tunnel-token)

restart_tunnel() {
  docker rm -f cf-tunnel 2>/dev/null || true
  docker run -d --name cf-tunnel --restart unless-stopped \
    --network container:news-platform \
    cloudflare/cloudflared:latest tunnel --no-autoupdate --protocol http2 run --token "$TOKEN" >/dev/null
}

# 路线 A：正式镜像构建（需要 Docker Hub 可达）
if docker build -t news-platform . >/tmp/deploy-build.log 2>&1; then
  echo "[路线A] 镜像构建成功"
  docker rm -f news-platform cf-tunnel 2>/dev/null || true
  docker run -d --name news-platform --restart unless-stopped -p 3002:3000 news-platform >/dev/null
else
  # 路线 B：热替换（⚠️ 依赖 news-platform 容器；若不存在则先从现有镜像起一个）
  echo "[路线B] Docker Hub 不可达，走本机构建 + 热替换"
  if ! docker ps --format '{{.Names}}' | grep -q '^news-platform$'; then
    docker rm -f news-platform 2>/dev/null || true
    docker run -d --name news-platform --restart unless-stopped -p 3002:3000 news-platform >/dev/null
  fi
  pnpm build
  docker exec -u root news-platform mkdir -p /app_new
  docker cp .next/standalone/. news-platform:/app_new/
  docker exec -u root news-platform sh -c "mkdir -p /app_new/.next && rm -rf /app_old && mv /app /app_old && mv /app_new /app"
  docker cp .next/static news-platform:/app/.next/static
  docker cp public news-platform:/app/
  docker restart news-platform >/dev/null
fi

# 隧道总是重建（应用容器网络栈更新后必须重新挂载）
sleep 4
restart_tunnel
sleep 8

CONN=$(docker logs cf-tunnel 2>&1 | grep -c "Registered tunnel connection")
echo "应用:   http://localhost:3002"
echo "隧道:   ${CONN} 条连接"
echo "公网:   https://zixun.ekspaces.com"
