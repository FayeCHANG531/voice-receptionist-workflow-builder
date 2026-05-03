import React, { useState, useRef, useCallback } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import {
  MessageSquare, HelpCircle, GitBranch, Zap, Clock, CheckCircle,
  X, Play, Save, Upload, Plus, Minus, Maximize2, ChevronDown,
  Volume2, AlertCircle, GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

const NODE_W = 176;
const NODE_H = 72;

type NodeType = 'greeting' | 'question' | 'branch' | 'action' | 'wait' | 'end';

interface WFNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  config: Record<string, any>;
}

interface Connection {
  id: string;
  fromId: string;
  fromPort: 'output' | 'yes' | 'no';
  toId: string;
}

const NODE_META: Record<NodeType, { icon: React.ElementType; color: string; bg: string; border: string; zh: string; en: string }> = {
  greeting: { icon: MessageSquare, color: '#4f46e5', bg: '#eef2ff', border: '#a5b4fc', zh: '问候语', en: 'Greeting' },
  question: { icon: HelpCircle, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', zh: '问题收集', en: 'Question' },
  branch: { icon: GitBranch, color: '#d97706', bg: '#fffbeb', border: '#fcd34d', zh: '分支判断', en: 'Branch' },
  action: { icon: Zap, color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', zh: '执行动作', en: 'Action' },
  wait: { icon: Clock, color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', zh: '等待', en: 'Wait' },
  end: { icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#86efac', zh: '结束', en: 'End' },
};

const LIBRARY_NODES: { type: NodeType; zh: string; en: string }[] = [
  { type: 'greeting', zh: '问候语', en: 'Greeting' },
  { type: 'question', zh: '问题收集', en: 'Question' },
  { type: 'branch', zh: '分支判断', en: 'Branch' },
  { type: 'action', zh: '执行动作', en: 'Action' },
  { type: 'wait', zh: '等待', en: 'Wait' },
  { type: 'end', zh: '结束', en: 'End' },
];

const initNodes: WFNode[] = [
  { id: 'n1', type: 'greeting', x: 60, y: 180, label: '问候语', config: { greetingText: '您好！感谢您致电，请问有什么可以帮助您？', voice: 'zh-female-1', speed: 1.0 } },
  { id: 'n2', type: 'question', x: 300, y: 180, label: '身份验证', config: { questionText: '请问您的会员号是？', inputMethod: 'speech', maxWait: 10, retries: 2, timeoutMsg: '抱歉，我没有听清楚，请再试一次。' } },
  { id: 'n3', type: 'branch', x: 540, y: 180, label: '意图判断', config: { threshold: 0.8, fallback: 'human' } },
  { id: 'n4', type: 'action', x: 780, y: 100, label: '预约服务', config: { actionType: 'booking', params: {} } },
  { id: 'n5', type: 'end', x: 1020, y: 100, label: '结束(成功)', config: { endType: 'success' } },
  { id: 'n6', type: 'action', x: 780, y: 280, label: '人工转接', config: { actionType: 'transfer', params: {} } },
  { id: 'n7', type: 'end', x: 1020, y: 280, label: '结束', config: { endType: 'failure' } },
];

const initConns: Connection[] = [
  { id: 'c1', fromId: 'n1', fromPort: 'output', toId: 'n2' },
  { id: 'c2', fromId: 'n2', fromPort: 'output', toId: 'n3' },
  { id: 'c3', fromId: 'n3', fromPort: 'yes', toId: 'n4' },
  { id: 'c4', fromId: 'n3', fromPort: 'no', toId: 'n6' },
  { id: 'c5', fromId: 'n4', fromPort: 'output', toId: 'n5' },
  { id: 'c6', fromId: 'n6', fromPort: 'output', toId: 'n7' },
];

function getPortPos(node: WFNode, port: 'input' | 'output' | 'yes' | 'no') {
  if (port === 'input') return { x: node.x, y: node.y + NODE_H / 2 };
  if (port === 'output') return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
  if (port === 'yes') return { x: node.x + NODE_W, y: node.y + NODE_H / 3 };
  if (port === 'no') return { x: node.x + NODE_W, y: node.y + 2 * NODE_H / 3 };
  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
}

export default function WorkflowCanvas() {
  const { t } = useLang();
  const [nodes, setNodes] = useState<WFNode[]>(initNodes);
  const [connections] = useState<Connection[]>(initConns);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 1 });
  const [isDirty, setIsDirty] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ nodeId: string; mx: number; my: number; nx: number; ny: number } | null>(null);
  const panning = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedId);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId)!;
    dragging.current = { nodeId, mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };
    setSelectedId(nodeId);
    setConfigOpen(true);
  }, [nodes]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-canvas-bg]')) {
      panning.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y };
      setSelectedId(null);
      setConfigOpen(false);
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const dx = (e.clientX - dragging.current.mx) / transform.scale;
      const dy = (e.clientY - dragging.current.my) / transform.scale;
      setNodes(ns => ns.map(n =>
        n.id === dragging.current!.nodeId ? { ...n, x: dragging.current!.nx + dx, y: dragging.current!.ny + dy } : n
      ));
      setIsDirty(true);
    } else if (panning.current) {
      const dx = e.clientX - panning.current.mx;
      const dy = e.clientY - panning.current.my;
      setTransform(t => ({ ...t, x: panning.current!.tx + dx, y: panning.current!.ty + dy }));
    }
  }, [transform.scale]);

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
    panning.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setTransform(t => ({ ...t, scale: Math.max(0.3, Math.min(2.5, t.scale * factor)) }));
  }, []);

  const zoom = (factor: number) => setTransform(t => ({ ...t, scale: Math.max(0.3, Math.min(2.5, t.scale * factor)) }));
  const fitView = () => setTransform({ x: 40, y: 40, scale: 1 });

  const updateConfig = (key: string, val: any) => {
    setNodes(ns => ns.map(n => n.id === selectedId ? { ...n, config: { ...n.config, [key]: val } } : n));
    setIsDirty(true);
  };

  const addNode = (type: NodeType) => {
    const meta = NODE_META[type];
    const id = `n${Date.now()}`;
    setNodes(ns => [...ns, { id, type, x: 200, y: 200, label: t(meta.zh, meta.en), config: {} }]);
    setIsDirty(true);
  };

  const handleSave = () => {
    setIsDirty(false);
    toast.success(t('保存成功', 'Saved successfully'));
  };

  const handlePublish = () => {
    toast.success(t('发布成功', 'Published successfully'));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Node Library */}
      <aside className="flex flex-col flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto" style={{ width: 220 }}>
        <div className="px-4 py-3 border-b border-gray-100" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          {t('节点库', 'Node Library')}
        </div>
        <div className="p-3 space-y-1.5">
          {LIBRARY_NODES.map(item => {
            const meta = NODE_META[item.type];
            const Icon = meta.icon;
            return (
              <button
                key={item.type}
                onClick={() => addNode(item.type)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md border text-left transition-all hover:shadow-sm"
                style={{ background: meta.bg, borderColor: meta.border, cursor: 'grab' }}
              >
                <Icon size={15} color={meta.color} strokeWidth={2} />
                <span style={{ fontSize: '13px', color: '#374151' }}>{t(item.zh, item.en)}</span>
                <GripVertical size={13} color="#9ca3af" className="ml-auto" />
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 mt-1" style={{ fontSize: '11px', color: '#9ca3af' }}>
          {t('点击添加节点到画布', 'Click to add node to canvas')}
        </div>
      </aside>

      {/* Canvas Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 h-14 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm transition hover:bg-gray-50"
            style={{ color: '#374151' }}
          >
            <MessageSquare size={14} />
            {t('文字模拟', 'Text Simulation')}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm transition hover:bg-gray-50"
            style={{ color: '#374151' }}
          >
            <Play size={14} />
            {t('真实通话模拟', 'Live Call Test')}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition"
            style={{
              background: isDirty ? '#4f46e5' : '#f3f4f6',
              color: isDirty ? '#fff' : '#9ca3af',
              border: 'none',
            }}
          >
            <Save size={14} />
            {t('保存', 'Save')}
          </button>
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-white transition"
            style={{ background: '#22c55e' }}
          >
            <Upload size={14} />
            {t('发布', 'Publish')}
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden select-none"
          style={{ cursor: panning.current ? 'grabbing' : 'default' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          data-canvas-bg
        >
          {/* Grid bg */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="grid" x={transform.x % 24} y={transform.y % 24} width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#d1d5db" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Transformed content */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: '0 0',
              width: 2400,
              height: 1600,
            }}
          >
            {/* SVG connections */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
                </marker>
              </defs>
              {connections.map(conn => {
                const from = nodes.find(n => n.id === conn.fromId);
                const to = nodes.find(n => n.id === conn.toId);
                if (!from || !to) return null;
                const fp = getPortPos(from, conn.fromPort as any);
                const tp = getPortPos(to, 'input');
                const cx1 = fp.x + 70;
                const cx2 = tp.x - 70;
                const label = conn.fromPort === 'yes' ? (t('是', 'Yes')) : conn.fromPort === 'no' ? (t('否', 'No')) : '';
                const mx = (fp.x + tp.x) / 2;
                const my = (fp.y + tp.y) / 2;
                return (
                  <g key={conn.id}>
                    <path
                      d={`M ${fp.x} ${fp.y} C ${cx1} ${fp.y} ${cx2} ${tp.y} ${tp.x} ${tp.y}`}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      markerEnd="url(#arrow)"
                    />
                    {label && (
                      <text x={mx} y={my - 6} textAnchor="middle" fontSize="11" fill="#6366f1" fontWeight="500">
                        {label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const meta = NODE_META[node.type];
              const Icon = meta.icon;
              const selected = selectedId === node.id;
              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: NODE_W,
                    height: NODE_H,
                    background: meta.bg,
                    border: `1.5px solid ${selected ? '#4f46e5' : meta.border}`,
                    borderRadius: 8,
                    boxShadow: selected ? '0 0 0 2px rgba(79,70,229,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                    cursor: 'grab',
                    userSelect: 'none',
                  }}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  onDoubleClick={() => { setSelectedId(node.id); setConfigOpen(true); }}
                >
                  {/* Input port */}
                  <div style={{
                    position: 'absolute', left: -6, top: NODE_H / 2 - 6, width: 12, height: 12,
                    borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                  }} />

                  {/* Node header */}
                  <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                    <Icon size={13} color={meta.color} strokeWidth={2} />
                    <span style={{ fontSize: '11px', color: meta.color, fontWeight: 600 }}>{t(meta.zh, meta.en)}</span>
                  </div>
                  <div className="px-3 pb-2" style={{ fontSize: '13px', color: '#1f2937', fontWeight: 500 }}>
                    {node.label}
                  </div>

                  {/* Output port */}
                  {node.type === 'branch' ? (
                    <>
                      <div style={{
                        position: 'absolute', right: -6, top: NODE_H / 3 - 6, width: 12, height: 12,
                        borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                      }} />
                      <div style={{
                        position: 'absolute', right: -6, top: 2 * NODE_H / 3 - 6, width: 12, height: 12,
                        borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                      }} />
                    </>
                  ) : (
                    <div style={{
                      position: 'absolute', right: -6, top: NODE_H / 2 - 6, width: 12, height: 12,
                      borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: '#9ca3af', pointerEvents: 'none' }}>
              <GitBranch size={40} strokeWidth={1.5} />
              <p style={{ fontSize: '14px' }}>{t('从左侧拖拽节点开始构建', 'Drag nodes from the left to start')}</p>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1">
            <button onClick={() => zoom(1.15)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-50 shadow-sm">
              <Plus size={14} color="#374151" />
            </button>
            <button onClick={() => zoom(0.87)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-50 shadow-sm">
              <Minus size={14} color="#374151" />
            </button>
            <button onClick={fitView} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-50 shadow-sm">
              <Maximize2 size={14} color="#374151" />
            </button>
            <div className="text-center mt-1" style={{ fontSize: '11px', color: '#9ca3af' }}>
              {Math.round(transform.scale * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Config Panel */}
      {configOpen && selectedNode && (
        <aside className="flex flex-col bg-white border-l border-gray-200 flex-shrink-0 overflow-hidden" style={{ width: 360 }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              {(() => { const Icon = NODE_META[selectedNode.type].icon; return <Icon size={16} color={NODE_META[selectedNode.type].color} strokeWidth={2} />; })()}
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                {t('节点配置', 'Node Config')}
              </span>
            </div>
            <button onClick={() => setConfigOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100">
              <X size={15} color="#6b7280" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedNode.type === 'greeting' && (
              <>
                <FormField label={t('问候语文本', 'Greeting Text')} required>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.greetingText || ''}
                    onChange={e => updateConfig('greetingText', e.target.value)}
                    placeholder={t('请输入问候语文本...', 'Enter greeting text...')}
                  />
                  <button className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700">
                    <Volume2 size={12} />{t('试听', 'Preview')}
                  </button>
                </FormField>
                <FormField label={t('语音选择', 'Voice Selection')}>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.voice || 'zh-female-1'}
                    onChange={e => updateConfig('voice', e.target.value)}
                  >
                    <option value="zh-female-1">{t('普通话·女声', 'Mandarin · Female')}</option>
                    <option value="zh-male-1">{t('普通话·男声', 'Mandarin · Male')}</option>
                    <option value="en-female-1">English · Female</option>
                  </select>
                </FormField>
                <FormField label={t('语速', 'Speed')}>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0.5" max="2" step="0.1"
                      value={selectedNode.config.speed || 1.0}
                      onChange={e => updateConfig('speed', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span style={{ fontSize: '13px', color: '#374151', minWidth: 32 }}>
                      {(selectedNode.config.speed || 1.0).toFixed(1)}x
                    </span>
                  </div>
                </FormField>
              </>
            )}

            {selectedNode.type === 'question' && (
              <>
                <FormField label={t('问题文本', 'Question Text')} required>
                  <textarea rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.questionText || ''}
                    onChange={e => updateConfig('questionText', e.target.value)}
                    placeholder={t('请输入问题...', 'Enter question...')}
                  />
                </FormField>
                <FormField label={t('输入方式', 'Input Method')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.inputMethod || 'speech'}
                    onChange={e => updateConfig('inputMethod', e.target.value)}
                  >
                    <option value="speech">{t('语音识别', 'Speech Recognition')}</option>
                    <option value="dtmf">{t('按键输入', 'DTMF Input')}</option>
                    <option value="both">{t('语音+按键', 'Speech + DTMF')}</option>
                  </select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t('最大等待时间(s)', 'Max Wait (s)')}>
                    <input type="number" min="3" max="60"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                      style={{ fontSize: '13px' }}
                      value={selectedNode.config.maxWait || 10}
                      onChange={e => updateConfig('maxWait', parseInt(e.target.value))}
                    />
                  </FormField>
                  <FormField label={t('重试次数', 'Retries')}>
                    <input type="number" min="0" max="5"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                      style={{ fontSize: '13px' }}
                      value={selectedNode.config.retries || 2}
                      onChange={e => updateConfig('retries', parseInt(e.target.value))}
                    />
                  </FormField>
                </div>
                <FormField label={t('超时话术', 'Timeout Message')}>
                  <textarea rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.timeoutMsg || ''}
                    onChange={e => updateConfig('timeoutMsg', e.target.value)}
                    placeholder={t('超时后说...', 'On timeout say...')}
                  />
                </FormField>
              </>
            )}

            {selectedNode.type === 'branch' && (
              <>
                <FormField label={t('置信度阈值', 'Confidence Threshold')}>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="1" step="0.05"
                      value={selectedNode.config.threshold || 0.8}
                      onChange={e => updateConfig('threshold', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span style={{ fontSize: '13px', color: '#374151', minWidth: 40 }}>
                      {Math.round((selectedNode.config.threshold || 0.8) * 100)}%
                    </span>
                  </div>
                </FormField>
                <FormField label={t('降级方案', 'Fallback Strategy')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.fallback || 'human'}
                    onChange={e => updateConfig('fallback', e.target.value)}
                  >
                    <option value="human">{t('转人工', 'Transfer to Human')}</option>
                    <option value="retry">{t('重新提问', 'Retry Question')}</option>
                    <option value="end">{t('结束通话', 'End Call')}</option>
                  </select>
                </FormField>
              </>
            )}

            {selectedNode.type === 'action' && (
              <>
                <FormField label={t('动作类型', 'Action Type')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.actionType || 'booking'}
                    onChange={e => updateConfig('actionType', e.target.value)}
                  >
                    <option value="booking">{t('创建预约', 'Create Booking')}</option>
                    <option value="transfer">{t('转接通话', 'Transfer Call')}</option>
                    <option value="sms">{t('发送短信', 'Send SMS')}</option>
                    <option value="webhook">{t('调用Webhook', 'Call Webhook')}</option>
                  </select>
                </FormField>
              </>
            )}

            {selectedNode.type === 'end' && (
              <>
                <FormField label={t('结束类型', 'End Type')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                    style={{ fontSize: '13px' }}
                    value={selectedNode.config.endType || 'success'}
                    onChange={e => updateConfig('endType', e.target.value)}
                  >
                    <option value="success">{t('成功结束', 'Success')}</option>
                    <option value="failure">{t('异常结束', 'Failure')}</option>
                  </select>
                </FormField>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={() => { handleSave(); setConfigOpen(false); }}
              className="w-full py-2 rounded-md text-white text-sm font-medium transition"
              style={{ background: '#4f46e5' }}
            >
              {t('保存配置', 'Save Config')}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
        {label}
        {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}
