# Radar 可用接口整理

面向 Network Radar 看板的数据能力清单。采集脚本默认启用「已接入」项；其余可按需扩展。

## 地区过滤约定

| 看板地区 | 常用过滤 |
|----------|----------|
| 中国 | `location=CN` |
| 美国 | `location=US` |
| 欧洲 | 流量类 `continent=EU`；排名/事件按国家码（如 DE/FR/GB 或欧盟国家列表） |

时间窗常用：`dateRange=7d`；趋势可配合 `aggInterval=1d`。

---

## 1. HTTP 流量（网站侧画像）

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| 维度汇总 | `GET /radar/http/summary/{dimension}` | 占比快照 | **已接入** device_type / os / browser_family / bot_class |
| 维度时序 | `GET /radar/http/timeseries_groups/{dimension}` | 占比随时间变化 | 可选扩展 |
| 总量时序 | `GET /radar/http/timeseries` | 请求量趋势 | **已接入**（地区流量趋势） |
| Top 地点 | `GET /radar/http/top/locations` | 全球/过滤后地点排行 | 未接入 |
| Top AS | `GET /radar/http/top/ases` | 运营商排行 | 未接入 |

常用 dimension：`device_type`、`os`、`browser_family`、`bot_class`、`http_protocol`、`http_version`、`ip_version`、`tls_version`、`api_traffic`。

---

## 2. 域名排名（网站）

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| Top / Trending | `GET /radar/ranking/top` | `rankingType=POPULAR\|TRENDING_*`，可按 `location` | **已接入** POPULAR |
| 域名详情 | `GET /radar/ranking/domain/{domain}` | 含 top_locations | 未接入 |
| 排名时序 | `GET /radar/ranking/timeseries_groups` | 域名排名变化 | 未接入 |
| 互联网服务排行 | `GET /radar/ranking/internet_services/top` | 按服务类别 | 未接入 |

说明：Ranking 的 `location` 为国家码；欧洲需按国家分别拉取。

---

## 3. NetFlows（骨干流量趋势）

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| 流量时序 | `GET /radar/netflows/timeseries` | 网络流量随时间 | **已接入**（与 HTTP 趋势并列） |
| 汇总 / 维度 | `GET /radar/netflows/summary[/{dimension}]` | 流量构成 | 未接入 |
| 维度时序 | `GET /radar/netflows/timeseries_groups/{dimension}` | 如按设备 | 未接入 |
| Top AS / 地点 | `GET /radar/netflows/top/ases\|locations` | 排行 | 未接入 |

---

## 4. AI 爬虫

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| 维度汇总 | `GET /radar/ai/bots/summary/{dimension}` | 如 `USER_AGENT`、`CRAWL_PURPOSE`、`INDUSTRY` | **已接入** USER_AGENT |
| 维度时序 | `GET /radar/ai/bots/timeseries_groups/{dimension}` | AI 爬虫趋势 | 未接入 |

---

## 5. 事件 / 中断 / 异常（事件情报）

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| 注释/事件列表 | `GET /radar/annotations` | 通用事件流 | 可选 |
| 互联网中断 | `GET /radar/annotations/outages` | 停电、断缆、封锁等 | **已接入** |
| 中断按地点统计 | `GET /radar/annotations/outages/locations` | 地点计数 | 未接入 |
| 流量异常 | `GET /radar/traffic_anomalies` | 自动检测的流量骤降信号 | **已接入** |

`eventType` 常见：`OUTAGE`、`TRAFFIC_ANOMALY`、`GENERAL` 等。

---

## 6. 攻击情报

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| L7 维度汇总 | `GET /radar/attacks/layer7/summary/{dimension}` | `INDUSTRY` / `VERTICAL` / `MITIGATION_PRODUCT` 等 | **已接入** INDUSTRY + MITIGATION_PRODUCT |
| L7 时序 | `GET /radar/attacks/layer7/timeseries[_groups/{dim}]` | 攻击趋势 | 未接入 |
| L7 Top | `GET /radar/attacks/layer7/top/...` | 来源/目标地点等 | 未接入 |
| L3 维度汇总 | `GET /radar/attacks/layer3/summary/{dimension}` | PROTOCOL / VECTOR / INDUSTRY（`direction=TARGET`） | **已接入** |
| L3 时序 | `GET /radar/attacks/layer3/timeseries` | L3 攻击趋势 | **已接入** |
| L3 Top | `GET /radar/attacks/layer3/top/...` | 来源/目标地点等 | 未接入 |

---

## 7. DNS

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| 维度汇总 | `GET /radar/dns/summary/{dimension}` | `QUERY_TYPE` / `PROTOCOL` 等 | **已接入** |
| 时序 | `GET /radar/dns/timeseries` | DNS 查询趋势 | **已接入** |
| 维度时序 | `GET /radar/dns/timeseries_groups/{dim}` | 分组趋势 | 未接入 |
| Top | `GET /radar/dns/top/ases\|locations` | 排行 | 未接入 |

---

## 8. 质量 / 速度（体验情报）

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| IQI 汇总 | `GET /radar/quality/iqi/summary` | **必须**传 `metric=BANDWIDTH\|LATENCY\|DNS`，返回 p25/p50/p75 | **已接入**（分三次请求合并） |
| IQI 时序 | `GET /radar/quality/iqi/timeseries_groups` | 质量趋势 | 未接入 |
| Speed 测试 | `GET /radar/quality/speed/...` | 测速相关 | 未接入 |

---

## 9. BGP

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| 更新时序 | `GET /radar/bgp/timeseries` | BGP 更新量趋势 | **已接入** |
| 劫持事件 | `GET /radar/bgp/hijacks/events` | 疑似劫持 | **已接入** |
| 泄漏事件 | `GET /radar/bgp/leaks/events` | 路由泄漏 | **已接入** |
| Top AS / 前缀 / RPKI 等 | `GET /radar/bgp/top/...`、`/rpki/...` | 深度路由分析 | 未接入 |

## 10. 邮箱

| 能力 | 端点 | 说明 | 状态 |
|------|------|------|------|
| 安全汇总 | `GET /radar/email/security/summary/{dimension}` | SPAM / MALICIOUS / SPOOF / THREAT_CATEGORY / SPF / DKIM / DMARC / ARC | **已接入**（全球，无地区过滤） |
| 安全时序 | `GET /radar/email/security/timeseries_groups/{dim}` | 邮件安全趋势 | 未接入 |
| 邮件路由 | `GET /radar/email/routing/...` | 路由侧指标 | 未接入 |

## 11. 其他模块（暂未接入）

- **Certificate Transparency**：证书签发趋势  
- **Entities / AS / Locations**：实体元数据查询  
- **Datasets**：大型排名数据集下载  

---

## 本仓库落盘结构

| 文件 | 内容 |
|------|------|
| `public/data/{cn,us,eu}.json` | 地区汇总 + 趋势 + 攻击占比 + 地区相关事件 |
| `public/data/intel.json` | 全局近期中断与流量异常（跨地区情报流） |
| `public/data/meta.json` | 采集时间、错误摘要 |

重新拉取：

```bash
$env:CF_API_TOKEN="你的token"
npm run fetch
```
