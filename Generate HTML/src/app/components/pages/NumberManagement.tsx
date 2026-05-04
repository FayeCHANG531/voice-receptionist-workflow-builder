import React, { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { Plus, Search, ChevronDown, AlertTriangle, X, Check, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

interface NumberRecord {
  id: string;
  number: string;
  type: 'platform' | 'byod' | 'webrtc';
  status: 'active' | 'unbound' | 'porting';
  receptionistZh: string;
  receptionistEn: string;
  purchaseDate: string;
}

const initialNumbers: NumberRecord[] = [
  { id: '1', number: '+1 (415) 555-0100', type: 'platform', status: 'active', receptionistZh: '客服1号', receptionistEn: 'Receptionist 1', purchaseDate: '2026-03-15' },
  { id: '2', number: '+1 (415) 555-0101', type: 'platform', status: 'unbound', receptionistZh: '—', receptionistEn: '—', purchaseDate: '2026-03-20' },
  { id: '3', number: '+86 21 5500-1001', type: 'platform', status: 'active', receptionistZh: '节假日专线', receptionistEn: 'Holiday Line', purchaseDate: '2026-04-01' },
  { id: '4', number: 'sip:office@pbx.company.com', type: 'byod', status: 'active', receptionistZh: '客服2号', receptionistEn: 'Receptionist 2', purchaseDate: '2026-04-10' },
  { id: '5', number: '+1 (650) 555-0300', type: 'platform', status: 'porting', receptionistZh: '—', receptionistEn: '—', purchaseDate: '2026-05-01' },
];

const typeLabels = {
  platform: { zh: '平台托管', en: 'Platform', color: '#4f46e5', bg: '#eef2ff' },
  byod: { zh: '自带号码', en: 'BYOD', color: '#d97706', bg: '#fffbeb' },
  webrtc: { zh: 'WebRTC', en: 'WebRTC', color: '#7c3aed', bg: '#f5f3ff' },
};

const statusLabels = {
  active: { zh: '活跃', en: 'Active', color: '#16a34a', bg: '#dcfce7' },
  unbound: { zh: '未绑定', en: 'Unbound', color: '#d97706', bg: '#fef9c3' },
  porting: { zh: '移植中', en: 'Porting', color: '#2563eb', bg: '#dbeafe' },
};

const availableToBuy = [
  { num: '+1 (408) 555-0401', loc: (t: any) => t('圣何塞', 'San Jose'), price: (t: any) => t('¥35/月', '$5/mo') },
  { num: '+1 (408) 555-0402', loc: (t: any) => t('圣何塞', 'San Jose'), price: (t: any) => t('¥35/月', '$5/mo') },
  { num: '+1 (510) 555-0501', loc: (t: any) => t('奥克兰', 'Oakland'), price: (t: any) => t('¥35/月', '$5/mo') },
  { num: '+1 (650) 555-0601', loc: (t: any) => t('帕洛阿尔托', 'Palo Alto'), price: (t: any) => t('¥35/月', '$5/mo') },
  { num: '+86 10 8800-3003', loc: (t: any) => t('北京', 'Beijing'), price: (t: any) => t('¥35/月', '$5/mo') },
  { num: '+86 20 8800-4004', loc: (t: any) => t('广州', 'Guangzhou'), price: (t: any) => t('¥35/月', '$5/mo') },
  { num: '+86 21 8800-5005', loc: (t: any) => t('上海', 'Shanghai'), price: (t: any) => t('¥40/月', '$6/mo') },
  { num: '+86 755 8800-6006', loc: (t: any) => t('深圳', 'Shenzhen'), price: (t: any) => t('¥35/月', '$5/mo') },
];

export default function NumberManagement() {
  const { t } = useLang();
  const [numbers, setNumbers] = useState<NumberRecord[]>(initialNumbers);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchVal, setSearchVal] = useState('');
  const [showPurchase, setShowPurchase] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<NumberRecord | null>(null);
  const [selectedBuy, setSelectedBuy] = useState<string | null>(null);
  const [purchaseArea, setPurchaseArea] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const filtered = numbers.filter(n => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter !== 'all' && n.status !== statusFilter) return false;
    if (searchVal && !n.number.includes(searchVal)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRelease = () => {
    if (!releaseTarget) return;
    if (releaseTarget.status === 'active' && releaseTarget.receptionistZh !== '—') {
      toast.error(t('此号码正在使用，请先解绑', 'Number in use, unbind first'));
      setReleaseTarget(null);
      return;
    }
    setNumbers(ns => ns.filter(n => n.id !== releaseTarget.id));
    toast.success(t('号码已释放，7天后正式生效', 'Number released. Effective after 7 days'));
    setReleaseTarget(null);
  };

  const handlePurchase = () => {
    if (!selectedBuy) return;
    const newNum: NumberRecord = {
      id: `${Date.now()}`, number: selectedBuy, type: 'platform', status: 'unbound', receptionistZh: '—', receptionistEn: '—',
      purchaseDate: new Date().toISOString().split('T')[0],
    };
    setNumbers(ns => [newNum, ...ns]);
    toast.success(t(`号码 ${selectedBuy} 购买成功`, `Number ${selectedBuy} purchased`));
    setShowPurchase(false);
    setSelectedBuy(null);
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9ca3af" />
          <input
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder={t('搜索号码...', 'Search numbers...')}
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
            style={{ fontSize: '13px', width: 200 }}
          />
        </div>
        <FilterSelect
          value={typeFilter}
          onChange={v => { setTypeFilter(v); setPage(1); }}
          options={[
            { value: 'all', zh: '全部类型', en: 'All Types' },
            { value: 'platform', zh: '平台托管', en: 'Platform' },
            { value: 'byod', zh: '自带号码', en: 'BYOD' },
            { value: 'webrtc', zh: 'WebRTC', en: 'WebRTC' },
          ]}
          t={t}
        />
        <FilterSelect
          value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(1); }}
          options={[
            { value: 'all', zh: '全部状态', en: 'All Status' },
            { value: 'active', zh: '活跃', en: 'Active' },
            { value: 'unbound', zh: '未绑定', en: 'Unbound' },
            { value: 'porting', zh: '移植中', en: 'Porting' },
          ]}
          t={t}
        />
        <div className="flex-1" />
        <button
          onClick={() => setShowPurchase(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-white text-sm font-medium"
          style={{ background: '#4f46e5' }}
        >
          <Plus size={14} />
          {t('购买号码', 'Purchase Number')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: '#9ca3af' }}>
            <Search size={32} strokeWidth={1.5} />
            <p style={{ fontSize: '14px' }}>{t('暂无号码，购买您的第一个号码开始使用', 'No numbers yet. Purchase your first number to get started')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f9fafb', fontSize: '12px', color: '#6b7280' }}>
                    {[t('号码', 'Number'), t('类型', 'Type'), t('状态', 'Status'),
                      t('绑定接待员', 'Bound Receptionist'), t('购买日期', 'Purchase Date'), t('操作', 'Actions')].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(num => {
                    const tl = typeLabels[num.type];
                    const sl = statusLabels[num.status];
                    return (
                      <tr key={num.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3" style={{ fontSize: '13px', fontFamily: 'monospace', color: '#1f2937', fontWeight: 500 }}>
                          {num.number}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: tl.bg, color: tl.color }}>
                            {t(tl.zh, tl.en)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: sl.bg, color: sl.color }}>
                            {t(sl.zh, sl.en)}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: '13px', color: '#374151' }}>
                          {t(num.receptionistZh, num.receptionistEn)}
                        </td>
                        <td className="px-4 py-3" style={{ fontSize: '13px', color: '#6b7280' }}>
                          {num.purchaseDate}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setReleaseTarget(num)}
                            className="px-2.5 py-1.5 rounded-md border border-gray-200 text-xs transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                            style={{ color: '#374151' }}
                          >
                            {t('释放', 'Release')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {t(`共 ${filtered.length} 条`, `${filtered.length} records`)}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-7 h-7 rounded flex items-center justify-center text-sm"
                      style={{
                        background: page === p ? '#4f46e5' : 'transparent',
                        color: page === p ? '#fff' : '#374151',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchase && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{t('购买号码', 'Purchase Number')}</h3>
              <button onClick={() => setShowPurchase(false)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100">
                <X size={15} color="#6b7280" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9ca3af" />
                  <input type="text"
                    value={purchaseArea}
                    onChange={e => setPurchaseArea(e.target.value)}
                    placeholder={t('输入区号过滤, 如 010、021', 'Filter by area code, e.g. 010')}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableToBuy.filter(n => !purchaseArea || n.num.includes(purchaseArea)).map(n => {
                  const isSelected = selectedBuy === n.num;
                  return (
                  <button
                    key={n.num}
                    onClick={() => setSelectedBuy(isSelected ? null : n.num)}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-md border text-left transition"
                    style={{
                      borderColor: isSelected ? '#4f46e5' : '#e5e7eb',
                      background: isSelected ? '#eef2ff' : '#fff',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#1f2937' }}>{n.num}</span>
                      <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: 2 }}>{n.loc(t)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>{n.price(t)}</span>
                      {isSelected && <Check size={14} color="#4f46e5" />}
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowPurchase(false)} className="flex-1 py-2 rounded-md border border-gray-200 text-sm" style={{ color: '#374151' }}>
                {t('取消', 'Cancel')}
              </button>
              <button
                onClick={handlePurchase}
                disabled={!selectedBuy}
                className="flex-1 py-2 rounded-md text-white text-sm font-medium transition"
                style={{ background: selectedBuy ? '#4f46e5' : '#9ca3af' }}
              >
                {t('确认购买', 'Confirm Purchase')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Confirm Modal */}
      {releaseTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fef3c7' }}>
                <AlertTriangle size={20} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{t('释放号码', 'Release Number')}</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
              {t('确定要释放号码', 'Confirm releasing')} <strong>{releaseTarget.number}</strong>?
            </p>
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg" style={{ background: '#fffbeb' }}>
              <AlertTriangle size={14} color="#d97706" className="flex-shrink-0 mt-0.5" />
              <p style={{ fontSize: '12px', color: '#92400e' }}>
                {t('7天冷却期：号码释放后7天内无法重新购买同一号码。', '7-Day Cooling Period: This number cannot be repurchased for 7 days after release.')}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setReleaseTarget(null)} className="flex-1 py-2 rounded-md border border-gray-200 text-sm" style={{ color: '#374151' }}>
                {t('取消', 'Cancel')}
              </button>
              <button onClick={handleRelease} className="flex-1 py-2 rounded-md text-white text-sm" style={{ background: '#ef4444' }}>
                {t('确认释放', 'Confirm Release')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options, t }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; zh: string; en: string }[];
  t: (zh: string, en: string) => string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white"
        style={{ fontSize: '13px', color: '#374151' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{t(o.zh, o.en)}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" color="#6b7280" />
    </div>
  );
}
