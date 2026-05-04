import React, { useState, useEffect } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { Phone, Users, BarChart2, AlertTriangle, MoreHorizontal, RefreshCw, Settings, Check, Plus, X, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

interface Receptionist { id: string; name: (t: any) => string; flow: string; enabled: boolean; meta: (t: any) => string; }

const initialReceptionists: Receptionist[] = [
  { id: 'r1', name: t => t('客服1号', 'Receptionist 1'), flow: 'v2', enabled: true, meta: t => t('v2.0 · 绑定 3 个号码', 'v2.0 · 3 numbers bound') },
  { id: 'r2', name: t => t('客服2号', 'Receptionist 2'), flow: 'v1', enabled: false, meta: t => t('v1.0 · 绑定 2 个号码', 'v1.0 · 2 numbers bound') },
  { id: 'r3', name: t => t('节假日专线', 'Holiday Line'), flow: 'v1', enabled: true, meta: t => t('v1.0 · 绑定 1 个号码', 'v1.0 · 1 number bound') },
];

interface MockCall { id: string; number: string; receptionistId: string; start: string; duration: string; nodeZh: string; nodeEn: string; status: 'active' | 'queue'; }

const initialCalls: MockCall[] = [
  { id: 'C-001', number: '+86 138 0013 8000', receptionistId: 'r1', start: '10:30:12', duration: '2:34', nodeZh: '意图判断', nodeEn: 'Intent Analysis', status: 'active' },
  { id: 'C-002', number: '+86 139 5521 0033', receptionistId: 'r1', start: '10:28:45', duration: '4:01', nodeZh: '预约确认', nodeEn: 'Booking Confirm', status: 'active' },
  { id: 'C-003', number: '+86 150 8800 1122', receptionistId: 'r3', start: '10:31:00', duration: '1:12', nodeZh: '身份验证', nodeEn: 'ID Verification', status: 'active' },
  { id: 'C-004', number: '+86 137 6601 9988', receptionistId: 'r1', start: '10:29:30', duration: '2:42', nodeZh: '问候语', nodeEn: 'Greeting', status: 'queue' },
  { id: 'C-005', number: '+86 153 2201 7755', receptionistId: 'r3', start: '10:32:05', duration: '0:27', nodeZh: '—', nodeEn: '—', status: 'queue' },
];

const kpis = [
  { zh: '在线通话', en: 'Active Calls', value: 12, change: '+3', subEn: '+12% vs yesterday', subZh: '较昨日 +12%', icon: Phone, color: '#4f46e5', bg: '#eef2ff' },
  { zh: '排队中', en: 'In Queue', value: 3, change: '+1', subEn: 'Avg wait 28s', subZh: '平均等待 28s', icon: Users, color: '#d97706', bg: '#fffbeb' },
  { zh: '今日总数', en: "Today's Total", value: 248, change: '+18', subEn: '72% of target', subZh: '目标完成 72%', icon: BarChart2, color: '#16a34a', bg: '#f0fdf4' },
  { zh: '异常', en: 'Exceptions', value: 5, change: '-2', subEn: '2 timeout / 1 drop', subZh: '2 超时 / 1 断线', icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
];

export default function RuntimeManagement() {
  const { t } = useLang();
  const [receptionists, setReceptionists] = useState<Receptionist[]>(initialReceptionists);
  const [calls, setCalls] = useState<MockCall[]>(initialCalls);
  const [toggles, setToggles] = useState<Record<string, boolean>>({ r1: true, r2: false, r3: true });
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [alertEmail, setAlertEmail] = useState('admin@example.com');
  const [queueThreshold, setQueueThreshold] = useState('20');
  const [waitTimeout, setWaitTimeout] = useState('60');
  const [errorRateThreshold, setErrorRateThreshold] = useState('5');
  const [alertChannel, setAlertChannel] = useState('email');
  const [thresholdError, setThresholdError] = useState('');
  const [tick, setTick] = useState(0);
  const [showAddReceptionist, setShowAddReceptionist] = useState(false);
  const [newRecName, setNewRecName] = useState('');

  useEffect(() => {
    const id = setInterval(() => setTick(v => v + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = (id: string) => {
    const next = !toggles[id];
    setToggles(t => ({ ...t, [id]: next }));
    toast.success(next ? t('已启用', 'Enabled') : t('已暂停', 'Paused'));
  };

  const handleDeleteReceptionist = (id: string) => {
    setReceptionists(rs => rs.filter(r => r.id !== id));
    setToggles(tg => { const n = { ...tg }; delete n[id]; return n; });
    toast.success(t('接待员已删除', 'Receptionist removed'));
  };

  const handleAddReceptionist = () => {
    if (!newRecName.trim()) return;
    const newId = `r${Date.now()}`;
    const displayName = newRecName.trim();
    setReceptionists(rs => [...rs, {
      id: newId,
      name: (_t: any) => _t(displayName, displayName),
      flow: 'v1',
      enabled: true,
      meta: (_t: any) => _t('v1.0 · 未绑定号码', 'v1.0 · No numbers bound'),
    }]);
    setToggles(tg => ({ ...tg, [newId]: true }));
    setNewRecName('');
    setShowAddReceptionist(false);
    toast.success(t(`接待员 ${displayName} 已添加`, `Receptionist ${displayName} added`));
  };

  const handleForceStop = (callId: string) => {
    setCalls(cs => cs.filter(c => c.id !== callId));
    toast(t('通话已强制终止', 'Call forcefully terminated'));
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
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: 4 }}>{t(kpi.subZh, kpi.subEn)}</p>
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
              {calls.map(call => {
                const rec = receptionists.find(r => r.id === call.receptionistId);
                return (
                <tr key={call.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{call.id}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>{call.number}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>{rec ? rec.name(t) : '—'}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#6b7280' }}>{call.start}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{call.duration}</td>
                  <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>{t(call.nodeZh, call.nodeEn)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
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
                      {call.status === 'active' && (
                        <button
                          onClick={() => handleForceStop(call.id)}
                          className="p-1 rounded hover:bg-red-50"
                          title={t('强制终止', 'Force Stop')}
                        >
                          <PhoneOff size={12} color="#ef4444" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Receptionist controls */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{t('接待员控制', 'Receptionist Control')}</span>
            <button
              onClick={() => setShowAddReceptionist(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white"
              style={{ background: '#4f46e5' }}
            >
              <Plus size={13} />{t('新增', 'Add')}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {receptionists.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{r.name(t)}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>
                    {r.meta(t)}
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
                  <button
                    onClick={() => handleDeleteReceptionist(r.id)}
                    className="p-1 rounded hover:bg-red-50"
                    title={t('删除', 'Delete')}
                  >
                    <X size={13} color="#9ca3af" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showAddReceptionist && (
            <div className="px-4 py-3 border-t border-gray-100" style={{ background: '#f9fafb' }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRecName}
                  onChange={e => setNewRecName(e.target.value)}
                  placeholder={t('接待员名称', 'Receptionist name')}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                  style={{ fontSize: '13px' }}
                  onKeyDown={e => e.key === 'Enter' && handleAddReceptionist()}
                />
                <button
                  onClick={handleAddReceptionist}
                  className="px-3 py-2 rounded-md text-white text-sm"
                  style={{ background: '#22c55e' }}
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setShowAddReceptionist(false)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={{ color: '#6b7280' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alert settings */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Settings size={15} color="#6b7280" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{t('告警配置', 'Alert Settings')}</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  {t('排队阈值', 'Queue Threshold')}
                </label>
                <input
                  type="number"
                  value={queueThreshold}
                  onChange={e => setQueueThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                  style={{ fontSize: '13px' }}
                />
              </div>
              <div>
                <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  {t('等待超时(s)', 'Wait Timeout(s)')}
                </label>
                <input
                  type="number"
                  value={waitTimeout}
                  onChange={e => setWaitTimeout(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                  style={{ fontSize: '13px', borderColor: thresholdError ? '#ef4444' : '#e5e7eb' }}
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
                  {t('异常率阈值(%)', 'Error Rate(%)')}
                </label>
                <input
                  type="number"
                  value={errorRateThreshold}
                  onChange={e => setErrorRateThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                {t('告警渠道', 'Alert Channel')}
              </label>
              <select
                value={alertChannel}
                onChange={e => setAlertChannel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white"
                style={{ fontSize: '13px' }}
              >
                <option value="email">{t('邮件', 'Email')}</option>
                <option value="sms">{t('短信', 'SMS')}</option>
                <option value="webhook">{t('Webhook', 'Webhook')}</option>
              </select>
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
