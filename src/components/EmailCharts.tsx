import type { EmailData } from '../types'
import { Panel } from './Panel'
import { ShareBarChart } from './ShareBarChart'
import { SharePieChart } from './SharePieChart'

export function EmailCharts({ data }: { data?: EmailData }) {
  return (
    <>
      <Panel title="邮箱 · 垃圾邮件" subtitle="全球邮件安全分类（无地区维度）">
        <SharePieChart data={data?.spam ?? {}} />
      </Panel>
      <Panel title="邮箱 · 恶意邮件" subtitle="MALICIOUS 分布">
        <SharePieChart data={data?.malicious ?? {}} />
      </Panel>
      <Panel title="邮箱 · 仿冒" subtitle="SPOOF 分布">
        <SharePieChart data={data?.spoof ?? {}} />
      </Panel>
      <Panel title="邮箱 · 威胁类别" subtitle="THREAT_CATEGORY">
        <ShareBarChart data={data?.threatCategory ?? {}} limit={10} />
      </Panel>
      <Panel title="邮箱认证 · SPF / DKIM / DMARC / ARC" wide>
        <div className="email-auth-grid">
          <div>
            <h3 className="email-auth-grid__title">SPF</h3>
            <ShareBarChart data={data?.spf ?? {}} limit={6} />
          </div>
          <div>
            <h3 className="email-auth-grid__title">DKIM</h3>
            <ShareBarChart data={data?.dkim ?? {}} limit={6} />
          </div>
          <div>
            <h3 className="email-auth-grid__title">DMARC</h3>
            <ShareBarChart data={data?.dmarc ?? {}} limit={6} />
          </div>
          <div>
            <h3 className="email-auth-grid__title">ARC</h3>
            <ShareBarChart data={data?.arc ?? {}} limit={6} />
          </div>
        </div>
      </Panel>
    </>
  )
}
