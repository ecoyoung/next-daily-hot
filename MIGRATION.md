# 迁移与部署指南（Windows / macOS / Linux）

本项目已支持 Docker Compose 一键部署，可无缝迁移到任意安装了 Docker 的机器。
公网域名（Cloudflare Tunnel）与部署机器解耦——新机器容器起来，流量自动切过去，域名无感知。

## Windows 新机部署步骤

### 1. 安装基础软件（一次性）

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)（安装时保持默认 WSL2 后端，装完重启）
- [Git for Windows](https://git-scm.com/download/win)（默认选项即可）

### 2. 克隆项目

```powershell
git clone https://github.com/ecoyoung/next-daily-hot.git
cd next-daily-hot
```

### 3. 放置隧道 token

在项目根目录创建 `tunnel.env` 文件（此文件已 gitignore，不会进仓库），内容一行：

```
TUNNEL_TOKEN=<从旧机器项目根目录的 tunnel.env 复制整行>
```

> 也可以从 Cloudflare Zero Trust 后台 → Networks → Tunnels → 对应隧道 → 安装命令里取 token。

### 4. 启动（首次会拉取基础镜像并构建，需要几分钟）

```powershell
docker compose --env-file tunnel.env up -d --build
```

### 5. 验证

- 本机：http://localhost:3002 （显示「资讯平台」）
- 公网：https://zixun.ekspaces.com
- 隧道状态：`docker logs cf-tunnel` 看到 `Registered tunnel connection` 即成功

### 6. 下线旧机器

新机验证通过后，在旧机器（Mac）上停掉容器，避免双活：

```bash
docker rm -f news-platform cf-tunnel
```

> 下线顺序无要求：Cloudflare 隧道支持多连接高可用，两台机器短暂并存期间域名照常可用。

## 日常运维（Windows）

```powershell
# 更新代码后重新部署（务必带 --force-recreate：隧道与应用共享网络栈）
git pull
docker compose --env-file tunnel.env up -d --build --force-recreate

# 查看日志
docker logs -f news-platform     # 应用
docker logs -f cf-tunnel         # 隧道

# 停止 / 启动
docker compose --env-file tunnel.env down
docker compose --env-file tunnel.env up -d
```

## 注意事项

- **重启/更新必须 `--force-recreate`**：隧道容器共享应用容器的网络栈，单独重启应用会断隧道
- 本机端口默认 **3002**，被占用时改 `docker-compose.yml` 里 `ports` 的前半段
- Windows 上 Docker Desktop 需保持运行状态（设置里可开启开机自启）
- 环境变量（站名/描述等）在 `.env`，改动后需重新 `up --build --force-recreate`
- macOS/Linux 同样适用本指南（命令一致）
