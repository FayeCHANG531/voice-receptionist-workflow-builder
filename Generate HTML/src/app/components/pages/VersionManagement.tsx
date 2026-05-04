import React, { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import { RotateCcw, Upload, Clock, User, ChevronRight, AlertTriangle, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Version {
  id: string;
  number: number;
  status: 'draft' | 'published';
  time: string;
  descriptionZh: string;
  descriptionEn: string;
  author: string;
  nodes: number;
  changes: VersionChange[];
}

interface VersionChange { type: 'added' | 'removed' | 'modified'; textZh: string; textEn: string; }

const versions: Version[] = [
  {
    id: 'v3', number: 3, status: 'draft', time: '2026-05-03 10:30', descriptionZh: '新增会员验证分支逻辑', descriptionEn: 'Added membership verification branch', author: 'Zhang San', nodes: 12,
    changes: [
      { type: 'added', textZh: '新增节点：会员等级判断 (Branch)', textEn: 'Added node: Membership Tier Check (Branch)' },
      { type: 'added', textZh: '新增连线：身份验证 → 会员等级判断', textEn: 'Added connection: ID Verify → Membership Tier Check' },
      { type: 'modified', textZh: '修改：问候语文本 — 更新为新版欢迎词', textEn: 'Modified: Greeting text updated to new version' },
    ]
  },
  {
    id: 'v2', number: 2, status: 'published', time: '2026-04-28 14:20', descriptionZh: '优化问候语，增加超时重试', descriptionEn: 'Optimized greeting, added timeout retry', author: 'Li Si', nodes: 9,
    changes: [
      { type: 'modified', textZh: '修改：问候语文本 — 语气更友好', textEn: 'Modified: Greeting text - friendlier tone' },
      { type: 'modified', textZh: '修改：身份验证节点 — 最大等待时间 8s→10s，重试次数 1→2', textEn: 'Modified: ID verify - max wait 8s→10s, retries 1→2' },
      { type: 'removed', textZh: '删除节点：旧版等待节点 (Wait)', textEn: 'Removed node: Legacy Wait node' },
    ]
  },
  {
    id: 'v1', number: 1, status: 'published', time: '2026-04-15 09:00', descriptionZh: '初始发布版本', descriptionEn: 'Initial release version', author: 'Zhang San', nodes: 5,
    changes: [
      { type: 'added', textZh: '初始创建：问候语节点', textEn: 'Created: Greeting node' },
      { type: 'added', textZh: '初始创建：身份验证节点', textEn: 'Created: ID Verification node' },
      { type: 'added', textZh: '初始创建：预约服务节点', textEn: 'Created: Booking Service node' },
      { type: 'added', textZh: '初始创建：结束节点', textEn: 'Created: End Call node' },
    ]
  },
];

const diffColors = {
  added: { bg: '#f0fdf4', border: '#86efac', text: '#166534', prefix: '+' },
  removed: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b', prefix: '−' },
  modified: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', prefix: '~' },
};

export default function VersionManagement() {
  const { t } = useLang();
  const [selectedId, setSelectedId] = useState('v3');
  const [showRollback, setShowRollback] = useState(false);

  const selected = versions.find(v => v.id === selectedId);

  const handleRollback = () => {
    setShowRollback(false);
    toast.success(t('回滚成功', 'Rollback successful'));
  };

  const handlePublish = () => {
    toast.success(t('发布成功', 'Published successfully'));
  };

  const handleCreateVersion = () => {
    const nextNum = versions.length > 0 ? Math.max(...versions.map(v => v.number)) + 1 : 1;
    toast.success(t(`新版本 v${nextNum} 已创建`, `Version v${nextNum} created`));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Version list */}
      <aside className="flex flex-col bg-white border-r border-gray-200 overflow-hidden flex-shrink-0" style={{ width: 320 }}>
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{t('版本历史', 'Version History')}</span>
          <button
            onClick={handleCreateVersion}
            className="px-3 py-1.5 rounded-md text-white text-xs font-medium"
            style={{ background: '#4f46e5' }}
          >
            + {t('新版本', 'New Version')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {versions.map((ver, i) => {
            const active = selectedId === ver.id;
            return (
              <button
                key={ver.id}
                onClick={() => setSelectedId(ver.id)}
                className="w-full text-left px-4 py-4 border-b border-gray-50 transition-colors hover:bg-gray-50"
                style={{ background: active ? '#eef2ff' : 'transparent', borderLeft: active ? '3px solid #4f46e5' : '3px solid transparent' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '14px', fontWeight: active ? 700 : 500, color: '#111827' }}>
                      v{ver.number}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        fontSize: '11px', fontWeight: 500,
                        background: ver.status === 'published' ? '#dcfce7' : '#fef9c3',
                        color: ver.status === 'published' ? '#16a34a' : '#854d0e',
                      }}
                    >
                      {ver.status === 'published' ? t('已发布', 'Published') : t('草稿', 'Draft')}
                    </span>
                  </div>
                </div>
                <p className="mt-1" style={{ fontSize: '13px', color: '#374151' }}>{t(ver.descriptionZh, ver.descriptionEn)}</p>
                <div className="flex items-center gap-3 mt-2" style={{ fontSize: '11px', color: '#9ca3af' }}>
                  <span className="flex items-center gap-1"><Clock size={11} />{ver.time}</span>
                  <span className="flex items-center gap-1"><User size={11} />{ver.author}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: Version details */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {selected ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>v{selected.number}</span>
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    fontSize: '12px', fontWeight: 500,
                    background: selected.status === 'published' ? '#dcfce7' : '#fef9c3',
                    color: selected.status === 'published' ? '#16a34a' : '#854d0e',
                  }}
                >
                  {selected.status === 'published' ? t('已发布', 'Published') : t('草稿', 'Draft')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selected.status === 'published' && (
                  <button
                    onClick={() => setShowRollback(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm transition hover:bg-gray-50"
                    style={{ color: '#374151' }}
                  >
                    <RotateCcw size={14} />
                    {t('回滚到此版本', 'Rollback to this version')}
                  </button>
                )}
                {selected.status === 'draft' && (
                  <button
                    onClick={handlePublish}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-sm"
                    style={{ background: '#22c55e' }}
                  >
                    <Upload size={14} />
                    {t('发布', 'Publish')}
                  </button>
                )}
              </div>
            </div>

            {/* Diff content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{t('版本描述', 'Description:')}</span>
                  <span style={{ fontSize: '13px', color: '#111827' }}>{t(selected.descriptionZh, selected.descriptionEn)}</span>
                </div>
                <div className="flex items-center gap-4" style={{ fontSize: '12px', color: '#9ca3af' }}>
                  <span className="flex items-center gap-1"><Clock size={12} />{selected.time}</span>
                  <span className="flex items-center gap-1"><User size={12} />{selected.author}</span>
                </div>
              </div>

              {/* 4-column info cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: t('创建时间', 'Created'), value: selected.time },
                  { label: t('作者', 'Author'), value: selected.author },
                  { label: t('状态', 'Status'), value: selected.status === 'published' ? t('已发布', 'Published') : t('草稿', 'Draft'), color: selected.status === 'published' ? '#16a34a' : '#d97706', bg: selected.status === 'published' ? '#dcfce7' : '#fef9c3' },
                  { label: t('节点数', 'Nodes'), value: String(selected.nodes) },
                ].map(card => (
                  <div key={card.label} className="rounded-lg p-3" style={{ background: '#f8fafc' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: 4 }}>{card.label}</p>
                    {card.color ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: card.bg, color: card.color }}>
                        {card.value}
                      </span>
                    ) : (
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{card.value}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-4">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{t('版本对比', 'Version Diff')}</span>
                  <div className="flex items-center gap-3" style={{ fontSize: '12px' }}>
                    <span className="flex items-center gap-1" style={{ color: '#16a34a' }}>
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#dcfce7', border: '1px solid #86efac' }} />
                      {t('新增', 'Added')}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#991b1b' }}>
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }} />
                      {t('删除', 'Deleted')}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#92400e' }}>
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }} />
                      {t('修改', 'Modified')}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {selected.changes.map((change, i) => {
                    const style = diffColors[change.type];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-md border"
                        style={{ background: style.bg, borderColor: style.border }}
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                          style={{ background: style.border, color: style.text }}>
                          {style.prefix}
                        </span>
                        <span style={{ fontSize: '13px', color: style.text }}>{t(change.textZh, change.textEn)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compare with previous */}
              {selected.number > 1 && (
                <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>
                    {t('与上一版本', 'Compare with')} v{selected.number - 1} {t('对比', '')}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    {[
                      { label: t('新增节点', 'Added Nodes'), value: selected.changes.filter(c => c.type === 'added').length, color: '#16a34a' },
                      { label: t('删除节点', 'Removed Nodes'), value: selected.changes.filter(c => c.type === 'removed').length, color: '#ef4444' },
                      { label: t('修改配置', 'Modified'), value: selected.changes.filter(c => c.type === 'modified').length, color: '#d97706' },
                    ].map(stat => (
                      <div key={stat.label} className="text-center p-3 rounded-md" style={{ background: '#f8f9fa' }}>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 2 }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: '#9ca3af', fontSize: '14px' }}>
            {t('首次保存后版本记录将在此显示', 'Version history will appear here after first save')}
          </div>
        )}
      </div>

      {/* Rollback Modal */}
      {showRollback && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fef3c7' }}>
                <AlertTriangle size={20} color="#d97706" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{t('确认回滚', 'Confirm Rollback')}</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
              {t(`确定要回滚到 v${selected?.number} 吗？当前草稿版本将会丢失。`, `Confirm rolling back to v${selected?.number}? Current draft will be lost.`)}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRollback(false)}
                className="flex-1 py-2 rounded-md border border-gray-200 text-sm transition hover:bg-gray-50"
                style={{ color: '#374151' }}
              >
                {t('取消', 'Cancel')}
              </button>
              <button
                onClick={handleRollback}
                className="flex-1 py-2 rounded-md text-white text-sm"
                style={{ background: '#ef4444' }}
              >
                {t('确认回滚', 'Confirm Rollback')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
