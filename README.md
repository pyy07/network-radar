# Network Radar

基于 [Cloudflare Radar API](https://developers.cloudflare.com/radar/) 的三地区（中国 / 美国 / 欧洲）网络流量可视化面板。

GitHub Actions 每 6 小时拉取快照写入 `public/data/`，前端为静态 React 应用，部署到 GitHub Pages。**API Token 不会进入浏览器。**

## 功能

- Top 网站排名（欧洲为 DE / FR / GB 分国家）
- 设备类型、操作系统、浏览器家族占比
- 人机分流（Human vs Automated）
- AI 爬虫 User-Agent 分布
- 流量趋势（HTTP + NetFlow）
- DNS 趋势 / 查询类型 / 协议
- L3 攻击趋势与协议/向量/行业
- BGP 趋势、劫持与泄漏事件
- 邮箱安全（垃圾邮件、恶意、仿冒、威胁类别、SPF/DKIM/DMARC/ARC；全球数据）
- 地区事件 / 全球情报流（中断、流量异常）
- 攻击情报（L7 行业与防护产品）
- 网络质量 IQI 摘要

可用接口完整清单见 [docs/radar-api-catalog.md](docs/radar-api-catalog.md)。

## 本地开发

```bash
npm install
npm run dev
```

默认使用仓库内的 mock 快照（`public/data/*.json`），无需 Token 即可预览 UI。

拉取真实数据：

```bash
# Windows PowerShell
$env:CF_API_TOKEN="你的_token"
npm run fetch
```

```bash
# bash
export CF_API_TOKEN=你的_token
npm run fetch
```

## Cloudflare API Token

1. 打开 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Create Token → 自定义权限
3. 权限：`Account` → `Radar` → `Read`
4. 创建后复制 Token（只显示一次）

## GitHub 部署

1. 将本仓库推送到 GitHub（仓库名建议 `network-radar`，与 Vite `base: '/network-radar/'` 一致）
2. Settings → Secrets and variables → Actions → New repository secret  
   - Name: `CF_API_TOKEN`  
   - Value: 上一步的 Token
3. Settings → Pages → Build and deployment → Source 选 **GitHub Actions**
4. Actions 中手动运行 **Fetch Radar Data** 生成真实快照（可选；也可用 mock 先部署）
5. 推送到 `main`/`master` 会触发 **Deploy GitHub Pages**  
   站点地址：`https://<user>.github.io/network-radar/`

若仓库名不是 `network-radar`，请同步修改 [`vite.config.ts`](vite.config.ts) 中的 `base`。

## 数据说明

| 地区 | 流量过滤 | Top 网站 |
|------|----------|----------|
| 中国 | `location=CN` | Ranking `CN` |
| 美国 | `location=US` | Ranking `US` |
| 欧洲 | `continent=EU` | Ranking `DE` / `FR` / `GB` |

时间窗：近 7 天（`dateRange=7d`）。更新频率：每 6 小时（见 `.github/workflows/fetch-data.yml`）。

## 脚本与目录

- `scripts/fetch-radar.mjs` — 采集并归一化 JSON
- `public/data/` — 静态快照（前端只读）
- `src/` — React + ECharts 看板
