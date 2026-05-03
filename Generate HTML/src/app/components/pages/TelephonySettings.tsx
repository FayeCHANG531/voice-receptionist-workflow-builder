import React, { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { Phone, Server, Globe, Search, Check, Copy, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const steps = {
  platform: [
    { zh: '搜索区号', en: 'Search Area Code' },
    { zh: '选择号码', en: 'Select Number' },
    { zh: '确认购买', en: 'Confirm Purchase' },
  ],
  byod: [
    { zh: '填写SIP信息', en: 'Enter SIP Info' },
    { zh: '验证连接', en: 'Verify Connection' },
    { zh: '绑定接待员', en: 'Bind Receptionist' },
  ],
  webrtc: [
    { zh: '复制嵌入代码', en: 'Copy Embed Code' },
    { zh: '部署到网站', en: 'Deploy to Website' },
    { zh: '测试通话', en: 'Test Call' },
  ],
};

const availableNumbers = [
  { number: '+1 (415) 555-0100', location: 'San Francisco, CA', price: '$1.15/mo' },
  { number: '+1 (415) 555-0101', location: 'San Francisco, CA', price: '$1.15/mo' },
  { number: '+1 (628) 555-0200', location: 'San Francisco, CA', price: '$1.15/mo' },
  { number: '+1 (650) 555-0300', location: 'Palo Alto, CA', price: '$1.15/mo' },
  { number: '+86 21 5500-1001', location: t => t('上海', 'Shanghai'), price: '¥8.00/月' },
  { number: '+86 10 8800-2002', location: t => t('北京', 'Beijing'), price: '¥8.00/月' },
];

const embedCode = `<!-- VoiceFlow AI Widget -->
<script src="https://cdn.voiceflow.ai/widget.js"
  data-key="YOUR_API_KEY"
  data-flow="f1"
  data-position="bottom-right"
  data-color="#4f46e5"
></script>`;

const costData = {
  platform: [
    { item: '月租费', itemEn: 'Monthly Fee', cost: '$1.15/号码' },
    { item: '通话费', itemEn: 'Call Fee', cost: '$0.013/分钟' },
    { item: 'AI处理费', itemEn: 'AI Processing', cost: '$0.005/分钟' },
    { item: '录音存储', itemEn: 'Recording Storage', cost: '$0.002/MB' },
  ],
  byod: [
    { item: '平台服务费', itemEn: 'Platform Fee', cost: '$29/月' },
    { item: 'AI处理费', itemEn: 'AI Processing', cost: '$0.005/分钟' },
    { item: 'SIP转接费', itemEn: 'SIP Transfer', cost: '运营商定价' },
  ],
  webrtc: [
    { item: '平台服务费', itemEn: 'Platform Fee', cost: '$19/月' },
    { item: 'AI处理费', itemEn: 'AI Processing', cost: '$0.005/分钟' },
    { item: '带宽费', itemEn: 'Bandwidth', cost: '免费（含1000分钟/月）' },
  ],
};

type TabType = 'platform' | 'byod' | 'webrtc';

export default function TelephonySettings() {
  const { t } = useLang();
  const [tab, setTab] = useState<TabType>('platform');
  const [search, setSearch] = useState('');
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [sipUri, setSipUri] = useState('');
  const [sipUser, setSipUser] = useState('');
  const [sipPass, setSipPass] = useState('');
  const [portingStep, setPortingStep] = useState(1);

  const tabs = [
    { id: 'platform' as TabType, icon: Phone, zh: '平台托管号码', en: 'Platform Managed' },
    { id: 'byod' as TabType, icon: Server, zh: '自带号码', en: 'Bring Your Own' },
    { id: 'webrtc' as TabType, icon: Globe, zh: 'WebRTC浏览器通话', en: 'WebRTC Browser Call' },
  ];

  const handlePurchase = () => {
    setShowPurchaseModal(false);
    toast.success(t('号码购买成功！', 'Number purchased successfully!'));
    setSelectedNumber(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode).catch(() => {});
    toast.success(t('代码已复制', 'Code copied'));
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white px-5 gap-0 flex-shrink-0">
        {tabs.map(tb => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className="flex items-center gap-2 px-4 py-4 border-b-2 transition-colors"
              style={{
                borderColor: active ? '#4f46e5' : 'transparent',
                color: active ? '#4f46e5' : '#6b7280',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
              }}
            >
              <Icon size={15} />
              {t(tb.zh, tb.en)}
            </button>
          );
        })}
      </div>

      <div className="p-5 max-w-4xl">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {steps[tab].map((step, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: i === 0 ? '#4f46e5' : '#e5e7eb', color: i === 0 ? '#fff' : '#9ca3af' }}
                >
                  {i + 1}
                </div>
                <span style={{ fontSize: '13px', color: i === 0 ? '#4f46e5' : '#9ca3af', fontWeight: i === 0 ? 500 : 400 }}>
                  {t(step.zh, step.en)}
                </span>
              </div>
              {i < steps[tab].length - 1 && <ChevronRight size={14} color="#d1d5db" />}
            </React.Fragment>
          ))}
        </div>

        {/* Platform Managed Tab */}
        {tab === 'platform' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                {t('搜索可用号码', 'Search Available Numbers')}
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9ca3af" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('输入区号，如 415 或 021', 'Enter area code, e.g. 415')}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <button
                  className="px-4 py-2 rounded-md text-white text-sm"
                  style={{ background: '#4f46e5' }}
                >
                  {t('搜索', 'Search')}
                </button>
              </div>
            </div>

            {/* Number grid */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: 12 }}>
                {t('可用号码', 'Available Numbers')} ({availableNumbers.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {availableNumbers.map((n, i) => {
                  const loc = typeof n.location === 'function' ? n.location(t) : n.location;
                  const isSelected = selectedNumber === n.number;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedNumber(isSelected ? null : n.number)}
                      className="flex items-center justify-between px-3 py-3 rounded-md border text-left transition-all hover:shadow-sm"
                      style={{
                        borderColor: isSelected ? '#4f46e5' : '#e5e7eb',
                        background: isSelected ? '#eef2ff' : '#fff',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#111827', fontFamily: 'monospace' }}>{n.number}</p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>{loc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{n.price}</span>
                        {isSelected && <Check size={14} color="#4f46e5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedNumber && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="px-4 py-2 rounded-md text-white text-sm font-medium"
                    style={{ background: '#4f46e5' }}
                  >
                    {t('购买号码', 'Purchase Number')} — {selectedNumber}
                  </button>
                </div>
              )}
            </div>

            {/* Cost table */}
            <CostTable data={costData.platform} t={t} />
          </div>
        )}

        {/* BYOD Tab */}
        {tab === 'byod' && (
          <div className="space-y-4">
            {/* SIP Config */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                {t('SIP配置', 'SIP Configuration')}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                    {t('SIP URI', 'SIP URI')}<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" value={sipUri} onChange={e => setSipUri(e.target.value)}
                    placeholder="sip:username@sip.provider.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                      {t('认证用户名', 'Auth Username')}<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="text" value={sipUser} onChange={e => setSipUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                      {t('认证密码', 'Auth Password')}<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="password" value={sipPass} onChange={e => setSipPass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                      {t('SIP端口', 'SIP Port')}
                    </label>
                    <input type="number" defaultValue={5060}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                      {t('传输协议', 'Transport')}
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}>
                      <option>UDP</option><option>TCP</option><option>TLS</option>
                    </select>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ background: '#4f46e5' }}
                  onClick={() => toast.success(t('SIP连接验证成功', 'SIP connection verified'))}
                >
                  {t('验证连接', 'Verify Connection')}
                </button>
              </div>
            </div>

            {/* Number Porting */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                {t('号码移植进度', 'Number Porting Progress')}
              </p>
              <div className="space-y-3">
                {[
                  t('提交移植申请', 'Submit Porting Request'),
                  t('运营商审核', 'Carrier Review'),
                  t('移植生效', 'Porting Active'),
                  t('完成绑定', 'Binding Complete'),
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: i < portingStep ? '#4f46e5' : '#f3f4f6',
                        border: i === portingStep ? '2px solid #4f46e5' : 'none',
                      }}
                    >
                      {i < portingStep ? <Check size={13} color="#fff" /> : (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: i === portingStep ? '#4f46e5' : '#9ca3af' }}>{i + 1}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: i <= portingStep ? '#111827' : '#9ca3af', fontWeight: i === portingStep ? 500 : 400 }}>
                      {step}
                    </span>
                    {i === portingStep && (
                      <span className="ml-auto px-2 py-0.5 rounded-full" style={{ fontSize: '11px', background: '#eef2ff', color: '#4f46e5' }}>
                        {t('进行中', 'In Progress')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <CostTable data={costData.byod} t={t} />
          </div>
        )}

        {/* WebRTC Tab */}
        {tab === 'webrtc' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                {t('嵌入代码', 'Embed Code')}
              </p>
              <div className="relative">
                <pre
                  className="p-4 rounded-md overflow-x-auto"
                  style={{ background: '#1a1a2e', color: '#c8d0e7', fontSize: '12px', lineHeight: 1.6, fontFamily: 'monospace' }}
                >
                  {embedCode}
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#c8d0e7' }}
                >
                  <Copy size={12} />{t('复制', 'Copy')}
                </button>
              </div>
            </div>

            {/* Widget preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: 12 }}>
                {t('通话组件预览', 'Widget Preview')}
              </p>
              <div className="flex justify-center items-end py-8 gap-4" style={{ background: '#f0f2f5', borderRadius: 8, minHeight: 180 }}>
                <div className="p-3 rounded-xl shadow-lg bg-white border border-gray-100" style={{ width: 260 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#4f46e5' }}>
                      <Phone size={14} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>AI助手</p>
                      <p style={{ fontSize: '11px', color: '#22c55e' }}>● {t('在线', 'Online')}</p>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#4f46e5' }}>
                    {t('开始通话', 'Start Call')}
                  </button>
                </div>
              </div>
            </div>

            <CostTable data={costData.webrtc} t={t} />
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: 16 }}>{t('确认购买', 'Confirm Purchase')}</h3>
            <div className="p-3 rounded-lg border border-gray-100 mb-4" style={{ background: '#f8f9fa' }}>
              <p style={{ fontSize: '14px', color: '#374151' }}>{selectedNumber}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: 4 }}>$1.15/mo + 使用费</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPurchaseModal(false)} className="flex-1 py-2 rounded-md border border-gray-200 text-sm" style={{ color: '#374151' }}>
                {t('取消', 'Cancel')}
              </button>
              <button onClick={handlePurchase} className="flex-1 py-2 rounded-md text-white text-sm" style={{ background: '#4f46e5' }}>
                {t('确认购买', 'Confirm Purchase')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CostTable({ data, t }: { data: { item: string; itemEn: string; cost: string }[]; t: (zh: string, en: string) => string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{t('成本结构', 'Cost Structure')}</span>
      </div>
      <table className="w-full">
        <thead>
          <tr style={{ background: '#f9fafb', fontSize: '12px', color: '#6b7280' }}>
            <th className="text-left px-4 py-2.5 font-medium">{t('费用项', 'Item')}</th>
            <th className="text-right px-4 py-2.5 font-medium">{t('费率', 'Rate')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-gray-50">
              <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>{t(row.item, row.itemEn)}</td>
              <td className="px-4 py-3 text-right" style={{ fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{row.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
