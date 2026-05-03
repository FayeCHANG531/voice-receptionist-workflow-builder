import React, { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { Phone, TrendingUp, Clock, Star, TrendingDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const trendData7 = [
  { date: '4/27', calls: 180, answered: 168 },
  { date: '4/28', calls: 195, answered: 185 },
  { date: '4/29', calls: 142, answered: 132 },
  { date: '4/30', calls: 208, answered: 197 },
  { date: '5/1', calls: 165, answered: 152 },
  { date: '5/2', calls: 194, answered: 185 },
  { date: '5/3', calls: 200, answered: 190 },
];

const trendData30 = Array.from({ length: 30 }, (_, i) => ({
  date: `4/${i + 1 > 30 ? i - 29 : i + 1}`,
  calls: Math.floor(140 + Math.random() * 80),
  answered: Math.floor(125 + Math.random() * 75),
}));

const trendData90 = Array.from({ length: 12 }, (_, i) => ({
  date: `W${i + 1}`,
  calls: Math.floor(900 + Math.random() * 400),
  answered: Math.floor(840 + Math.random() * 380),
}));

const heatmapNodes = [
  { name: '问候语', nameEn: 'Greeting', rate: 98 },
  { name: '身份验证', nameEn: 'ID Verify', rate: 87 },
  { name: '意图识别', nameEn: 'Intent', rate: 76 },
  { name: '预约确认', nameEn: 'Booking', rate: 82 },
  { name: '支付处理', nameEn: 'Payment', rate: 65 },
  { name: '回调处理', nameEn: 'Callback', rate: 43 },
  { name: '结束确认', nameEn: 'End Confirm', rate: 91 },
  { name: '满意度调查', nameEn: 'Satisfaction', rate: 73 },
];

const funnelData = [
  { zh: '来电接入', en: 'Inbound Calls', value: 1284, percent: 100 },
  { zh: '成功接通', en: 'Connected', value: 1209, percent: 94.2 },
  { zh: '意图识别', en: 'Intent Recognized', value: 1050, percent: 81.8 },
  { zh: '任务完成', en: 'Task Completed', value: 892, percent: 69.5 },
  { zh: '满意评价', en: 'Satisfied', value: 812, percent: 63.2 },
];

const exceptions = [
  { zh: '识别失败', en: 'Recognition Failed', count: 42, rate: '3.3%', color: '#ef4444' },
  { zh: '超时挂断', en: 'Timeout Hangup', count: 28, rate: '2.2%', color: '#f59e0b' },
  { zh: '主动挂断', en: 'User Hangup', count: 15, rate: '1.2%', color: '#6b7280' },
  { zh: 'API错误', en: 'API Error', count: 7, rate: '0.5%', color: '#dc2626' },
];

function getHeatColor(rate: number) {
  if (rate >= 85) return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
  if (rate >= 65) return { bg: '#fef9c3', border: '#fde047', text: '#854d0e' };
  return { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' };
}

const kpis = [
  { zh: '通话量', en: 'Total Calls', value: '1,284', sub: '+12.3%', icon: Phone, color: '#4f46e5', bg: '#eef2ff' },
  { zh: '接通率', en: 'Answer Rate', value: '94.2%', sub: '+1.8%', icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4' },
  { zh: '平均通话时长', en: 'Avg Duration', value: '3m 24s', sub: '-8s', icon: Clock, color: '#d97706', bg: '#fffbeb' },
  { zh: '客户满意度', en: 'Satisfaction', value: '4.6/5', sub: '+0.2', icon: Star, color: '#7c3aed', bg: '#f5f3ff' },
];

export default function OperationsDashboard() {
  const { t } = useLang();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('7');

  const trendDataMap = { '7': trendData7, '30': trendData30, '90': trendData90 };
  const trendData = trendDataMap[period];

  return (
    <div className="h-full overflow-y-auto p-5">
      {/* KPI row + time selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="grid grid-cols-4 gap-4 flex-1 mr-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.zh} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{t(kpi.zh, kpi.en)}</span>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: kpi.bg }}>
                    <Icon size={16} color={kpi.color} />
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{kpi.value}</div>
                <div style={{ fontSize: '12px', color: kpi.sub.startsWith('+') ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                  {kpi.sub} {t('vs 上期', 'vs last period')}
                </div>
              </div>
            );
          })}
        </div>
        {/* Time range */}
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {([['7', t('近7天', 'Last 7d')], ['30', t('近30天', 'Last 30d')], ['90', t('近90天', 'Last 90d')]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val as any)}
              className="px-3 py-2 text-sm transition"
              style={{
                background: period === val ? '#4f46e5' : '#fff',
                color: period === val ? '#fff' : '#374151',
                borderRight: val !== '90' ? '1px solid #e5e7eb' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        {/* Line chart */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-4">
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            {t('通话趋势', 'Call Trend')}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="calls" name={t('来电量', 'Calls')} stroke="#4f46e5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="answered" name={t('接通量', 'Answered')} stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            {t('节点通过率热力图', 'Node Pass Rate Heatmap')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {heatmapNodes.map(node => {
              const style = getHeatColor(node.rate);
              return (
                <div
                  key={node.name}
                  className="flex items-center justify-between px-2.5 py-2 rounded-md border"
                  style={{ background: style.bg, borderColor: style.border }}
                >
                  <span style={{ fontSize: '11px', color: style.text, fontWeight: 500 }}>
                    {t(node.name, node.nameEn)}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: style.text }}>{node.rate}%</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3" style={{ fontSize: '11px', color: '#9ca3af' }}>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#86efac' }} />≥85%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#fde047' }} />65–85%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#fca5a5' }} />&lt;65%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Funnel */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-4">
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            {t('转化漏斗', 'Conversion Funnel')}
          </p>
          <div className="space-y-3">
            {funnelData.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-right flex-shrink-0" style={{ width: 100, fontSize: '12px', color: '#6b7280' }}>
                  {t(item.zh, item.en)}
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full flex items-center justify-end pr-3 rounded-md transition-all"
                    style={{
                      width: `${item.percent}%`,
                      background: `rgba(79, 70, 229, ${0.4 + i * 0.08})`,
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 500 }}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0" style={{ width: 44, fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>
                  {item.percent}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exception stats */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 12 }}>
            {t('异常统计', 'Exception Stats')}
          </p>
          <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{ background: '#fef2f2' }}>
            <div>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>7.2%</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: 2 }}>{t('异常通话占比', 'Exception Rate')}</p>
            </div>
            <div style={{ height: 40, width: 1, background: '#fca5a5' }} />
            <div>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626', lineHeight: 1 }}>92</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: 2 }}>{t('异常总数', 'Total Exceptions')}</p>
            </div>
          </div>
          <div className="space-y-2">
            {exceptions.map(ex => (
              <div key={ex.zh} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: ex.color }} />
                  <span style={{ fontSize: '13px', color: '#374151' }}>{t(ex.zh, ex.en)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{ex.count}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', width: 36, textAlign: 'right' }}>{ex.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
