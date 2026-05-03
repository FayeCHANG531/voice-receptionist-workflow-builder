import React, { useState, useEffect } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { Phone, Users, BarChart2, AlertTriangle, MoreHorizontal, RefreshCw, Settings, Check } from 'lucide-react';
import { toast } from 'sonner';

const receptionists = [
  { id: 'r1', name: t => t('客服1号', 'Receptionist 1'), flow: 'v2', enabled: true },
  { id: 'r2', name: t => t('客服2号', 'Receptionist 2'), flow: 'v1', enabled: false },
  { id: 'r3', name: t => t('节假日专线', 'Holiday Line'), flow: 'v1', enabled: true },
];

const mockCalls = [
  { id: 'C-001', number: '+86 138 0013 8000', receptionist: '客服1号', start: '10:30:12', duration: '2:34', node: '意图判断', status: 'active' },
  { id: 'C-002', number: '+86 139 5521 0033', receptionist: '客服1号', start: '10:28:45', duration: '4:01', node: '预约确认', status: 'active' },
  { id: 'C-003', number: '+86 150 8800 1122', receptionist: '节假日专线', start: '10:31:00', duration: '1:12', node: '身份验证', status: 'active' },
  { id: 'C-004', number: '+86 137 6601 9988', receptionist: '客服1号', start: '10:29:30', duration: '2:42', node: '问候语', status: 'queue' },
  { id: 'C-005', number: '+86 153 2201 7755', receptionist: '节假日专线', start: '10:32:05', duration: '0:27', node: '—', status: 'queue' },
];

const kpis = [
  { zh: '在线通话', en: 'Active Calls', value: 12, change: '+3', icon: Phone, color: '#4f46e5', bg: '#eef2ff' },
  { zh: '排队中', en: 'In Queue', value: 3, change: '+1', icon: Users, color: '#d97706', bg: '#fffbeb' },
  { zh: '今日总数', en: "Today's Total", value: 248, change: '+18', icon: BarChart2, color: '#16a34a', bg: '#f0fdf4' },
  { zh: '异常', en: 'Exceptions', value: 5, change: '-2', icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
];

export default function RuntimeManagement() {
  const { t } = useLang();
  const [toggles, setToggles] = useState<Record<string, boolean>>({ r1: true, r2: false, r3: true });
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [alertEmail, setAlertEmail] = useState('admin@example.com');
  const [thresholdError, setThresholdError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(v => v + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = (id: string) => {
    const next = !toggles[id];
    setToggles(t => ({ ...t, [id]: next }));
    toast.success(next ? t('已启用', 'Enabled') : t('已暂停', 'Paused'));
  };

  const handleSaveAlert = () => {
    const n = parseInt(alertThreshold);
    if (isNaN(n) || n < 1 || n > 100) {
      setThresholdError(t('请输入1-100之间的数字', 'Enter a number between 1-100'));
      return;
    }
    setThresholdError('');
    toast.success(t('告警配置已保存', 'Alert settings saved'));
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.zh} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{t(kpi.zh, kpi.en)}</span>
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: kpi.bg }}>
                  <Icon size={16} color={kpi.color} />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{kpi.value}</span>
                <span style={{ fontSize: '12px', color: kpi.change.startsWith('+') ? '#16a34a' : '#dc2626', marginBottom: 2 }}>
                  {kpi.change} {t('今日', 'today')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active calls table */}
      <div className="bg-white rounded-lg border border-gray-200 mb-5 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{t('实时通话', 'Active Calls')}</span>
          <button className="flex items-center gap-1.5 text-sm" style={{ color: '#4f46e5' }}>
            <RefreshCw size={13} />{t('刷新', 'Refresh')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f9fafb', fontSize: '12px', color: '#6b7280' }}>
                {[t('通话ID', 'Call ID'), t('号码', 'Number'), t('接待员', 'Receptionist'),
                  t('开始时间', 'Start'), t('时长', 'Duration'), t('当前节点', 'Current Node'), t('状态', 'Status')].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockCalls.map(call => (
                <tr key={call.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{call.id}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>{call.number}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>{call.receptionist}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#6b7280' }}>{call.start}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{call.duration}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>{call.node}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '11px', fontWeight: 500,
                        background: call.status === 'active' ? '#dcfce7' : '#fef9c3',
                        color: call.status === 'active' ? '#166534' : '#854d0e',
                      }}
                    >
                      {call.status === 'active' ? t('通话中', 'Active') : t('排队中', 'Queued')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Receptionist controls */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{t('接待员控制', 'Receptionist Control')}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {receptionists.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{r.name(t)}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>
                    {t('流程版本', 'Flow Version')}: {r.flow}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '12px', color: toggles[r.id] ? '#16a34a' : '#9ca3af' }}>
                    {toggles[r.id] ? t('启用', 'Enabled') : t('暂停', 'Paused')}
                  </span>
                  <button
                    onClick={() => handleToggle(r.id)}
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ background: toggles[r.id] ? '#22c55e' : '#d1d5db' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: toggles[r.id] ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert settings */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Settings size={15} color="#6b7280" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{t('告警配置', 'Alert Settings')}</span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                {t('连续失败阈值', 'Consecutive Failures Threshold')}
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={alertThreshold}
                onChange={e => { setAlertThreshold(e.target.value); setThresholdError(''); }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none"
                style={{ fontSize: '13px', borderColor: thresholdError ? '#ef4444' : '#e5e7eb', focusBorderColor: '#4f46e5' }}
                placeholder="5"
              />
              {thresholdError && (
                <p className="mt-1 flex items-center gap-1" style={{ fontSize: '12px', color: '#ef4444' }}>
                  <AlertTriangle size={11} />{thresholdError}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                {t('通知邮箱', 'Notification Email')}
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                style={{ fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                {t('通知渠道', 'Notification Channel')}
              </label>
              <div className="space-y-2">
                {[t('邮件', 'Email'), t('短信', 'SMS'), t('Webhook', 'Webhook')].map(ch => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={ch === t('邮件', 'Email')} className="rounded" />
                    <span style={{ fontSize: '13px', color: '#374151' }}>{ch}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleSaveAlert}
              className="w-full py-2 rounded-md text-white text-sm font-medium"
              style={{ background: '#4f46e5' }}
            >
              {t('保存配置', 'Save Config')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
