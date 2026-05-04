import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import {
  MessageSquare, HelpCircle, GitBranch, Zap, Clock, CheckCircle,
  X, Play, Save, Upload, Plus, Minus, Maximize2, ChevronDown,
  Volume2, AlertCircle, GripVertical, Phone, PhoneCall, PhoneForwarded,
  MessageCircle, Calendar, Bell, Globe, Brain, BookOpen, FileText,
  ClipboardList, Search, Users, Shield, Trash2, Copy, Undo2, Redo2
} from 'lucide-react';
import { toast } from 'sonner';

const NODE_W = 176;
const NODE_H = 72;

// Expanded node types: 6 categories, 18 types
type NodeCategory = 'trigger' | 'action' | 'logic' | 'data' | 'integration' | 'ai';

type NodeType =
  | 'incoming_call'
  | 'greeting' | 'question' | 'collect_info' | 'transfer_call' | 'send_sms' | 'end_call'
  | 'branch' | 'if_else' | 'business_hours' | 'call_type'
  | 'log_info' | 'wait'
  | 'crm_lookup' | 'calendar_booking' | 'send_notification' | 'webhook'
  | 'intent_detection' | 'knowledge_qa' | 'call_summary';

interface WFNode {
  id: string;
  type: NodeType;
  category: NodeCategory;
  x: number;
  y: number;
  label: string;
  config: Record<string, any>;
}

interface Connection {
  id: string;
  fromId: string;
  fromPort: string;
  toId: string;
}

interface SimMessage { id: string; role: 'system' | 'user'; content: string; nodeTag?: string; }

const nodeMetaMap: Record<NodeType, { icon: React.ElementType; color: string; bg: string; border: string; zh: string; en: string; category: NodeCategory }> = {
  incoming_call: { icon: PhoneCall, color: '#4f46e5', bg: '#ede9fe', border: '#a5b4fc', zh: '来电触发器', en: 'Incoming Call', category: 'trigger' },
  greeting: { icon: MessageSquare, color: '#4f46e5', bg: '#eef2ff', border: '#a5b4fc', zh: '问候/开场白', en: 'Greeting', category: 'action' },
  question: { icon: HelpCircle, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', zh: '提问', en: 'Ask Question', category: 'action' },
  collect_info: { icon: ClipboardList, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', zh: '收集来电信息', en: 'Collect Info', category: 'action' },
  transfer_call: { icon: PhoneForwarded, color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', zh: '转接呼叫', en: 'Transfer Call', category: 'action' },
  send_sms: { icon: MessageCircle, color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', zh: '发送短信', en: 'Send SMS', category: 'action' },
  end_call: { icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#86efac', zh: '通话结束', en: 'End Call', category: 'action' },
  branch: { icon: GitBranch, color: '#d97706', bg: '#fffbeb', border: '#fcd34d', zh: '条件分支', en: 'Conditional Branch', category: 'logic' },
  if_else: { icon: GitBranch, color: '#d97706', bg: '#fffbeb', border: '#fcd34d', zh: 'If/Else', en: 'If/Else', category: 'logic' },
  business_hours: { icon: Clock, color: '#d97706', bg: '#fffbeb', border: '#fcd34d', zh: '营业时间判断', en: 'Business Hours', category: 'logic' },
  call_type: { icon: Search, color: '#d97706', bg: '#fffbeb', border: '#fcd34d', zh: '来电类型检测', en: 'Call Type', category: 'logic' },
  log_info: { icon: ClipboardList, color: '#16a34a', bg: '#f0fdf4', border: '#86efac', zh: '记录信息', en: 'Log Info', category: 'data' },
  wait: { icon: Clock, color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', zh: '等待', en: 'Wait', category: 'data' },
  crm_lookup: { icon: Users, color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', zh: 'CRM查询', en: 'CRM Lookup', category: 'integration' },
  calendar_booking: { icon: Calendar, color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', zh: '日历预订', en: 'Calendar Booking', category: 'integration' },
  send_notification: { icon: Bell, color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', zh: '发送通知', en: 'Send Notification', category: 'integration' },
  webhook: { icon: Globe, color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', zh: 'Webhook', en: 'Webhook', category: 'integration' },
  intent_detection: { icon: Brain, color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc', zh: 'AI意图检测', en: 'AI Intent', category: 'ai' },
  knowledge_qa: { icon: BookOpen, color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc', zh: '知识库问答', en: 'Knowledge Q&A', category: 'ai' },
  call_summary: { icon: FileText, color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc', zh: '通话摘要生成', en: 'Call Summary', category: 'ai' },
};

const categoryMeta: Record<NodeCategory, { zh: string; en: string }> = {
  trigger: { zh: '触发器', en: 'Triggers' },
  action: { zh: '动作', en: 'Actions' },
  logic: { zh: '逻辑', en: 'Logic' },
  data: { zh: '数据', en: 'Data' },
  integration: { zh: '集成', en: 'Integrations' },
  ai: { zh: 'AI增强', en: 'AI Enhanced' },
};

const paletteCategories: { category: NodeCategory; nodes: NodeType[] }[] = [
  { category: 'trigger', nodes: ['incoming_call'] },
  { category: 'action', nodes: ['greeting', 'question', 'collect_info', 'transfer_call', 'send_sms', 'end_call'] },
  { category: 'logic', nodes: ['branch', 'if_else', 'business_hours', 'call_type'] },
  { category: 'data', nodes: ['log_info', 'wait'] },
  { category: 'integration', nodes: ['crm_lookup', 'calendar_booking', 'send_notification', 'webhook'] },
  { category: 'ai', nodes: ['intent_detection', 'knowledge_qa', 'call_summary'] },
];

function getNodeCategory(type: NodeType): NodeCategory { return nodeMetaMap[type].category; }

const initNodes: WFNode[] = [
  { id: 'n1', type: 'incoming_call', category: 'trigger', x: 60, y: 200, label: 'Incoming Call', config: { phone_number: 'All Numbers', mute_answer: 'No' } },
  { id: 'n2', type: 'greeting', category: 'action', x: 300, y: 200, label: 'Greeting', config: { greeting_text: 'Hello! Thank you for calling. How can I help you?', voice: 'Female · Gentle', speed: '1.0x' } },
  { id: 'n3', type: 'business_hours', category: 'logic', x: 540, y: 200, label: 'Business Hours', config: { schedule: 'Mon-Fri 09:00-18:00', timezone: 'Asia/Shanghai' } },
  { id: 'n4', type: 'question', category: 'action', x: 780, y: 100, label: 'Intent Collection', config: { question_text: 'Are you here to inquire, book, or complain?', input_method: 'Both', max_wait: '10s', retries: '2 times' } },
  { id: 'n5', type: 'end_call', category: 'action', x: 1020, y: 100, label: 'End Call', config: { end_msg: 'Thank you for calling, goodbye!', send_sms: 'No' } },
  { id: 'n6', type: 'greeting', category: 'action', x: 780, y: 300, label: 'After Hours Greeting', config: { greeting_text: 'We are currently closed. Please call back during business hours.', voice: 'Female · Gentle', speed: '1.0x' } },
  { id: 'n7', type: 'end_call', category: 'action', x: 1020, y: 300, label: 'End', config: { end_msg: 'Thank you for calling!', send_sms: 'No' } },
];

const initConns: Connection[] = [
  { id: 'c1', fromId: 'n1', fromPort: 'default', toId: 'n2' },
  { id: 'c2', fromId: 'n2', fromPort: 'default', toId: 'n3' },
  { id: 'c3', fromId: 'n3', fromPort: 'branch_open', toId: 'n4' },
  { id: 'c4', fromId: 'n3', fromPort: 'branch_closed', toId: 'n6' },
  { id: 'c5', fromId: 'n4', fromPort: 'default', toId: 'n5' },
  { id: 'c6', fromId: 'n6', fromPort: 'default', toId: 'n7' },
];

function getPortPos(node: WFNode, port: string) {
  if (port === 'input') return { x: node.x, y: node.y + NODE_H / 2 };
  if (port === 'default' || port === 'output') return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
  if (port === 'yes' || port === 'branch_true' || port === 'branch_open') return { x: node.x + NODE_W, y: node.y + NODE_H / 3 };
  if (port === 'no' || port === 'branch_false' || port === 'branch_closed') return { x: node.x + NODE_W, y: node.y + 2 * NODE_H / 3 };
  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
}

export default function WorkflowCanvas() {
  const { t } = useLang();
  const [nodes, setNodesBase] = useState<WFNode[]>(initNodes);
  const [connections] = useState<Connection[]>(initConns);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 1 });
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState<WFNode[][]>([initNodes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ nodeId: string; mx: number; my: number; nx: number; ny: number } | null>(null);
  const panning = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);

  const pushHistory = (ns: WFNode[]) => {
    setHistory(h => [...h.slice(0, historyIndex + 1), ns]);
    setHistoryIndex(i => i + 1);
    setNodesBase(ns);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setNodesBase(history[idx]);
    setIsDirty(true);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setNodesBase(history[idx]);
    setIsDirty(true);
  };

  const deleteNode = () => {
    if (!selectedId) return;
    const next = nodes.filter(n => n.id !== selectedId);
    pushHistory(next);
    setIsDirty(true);
    toast(t('节点已删除', 'Node deleted'));
  };

  const duplicateNode = () => {
    if (!selectedId) return;
    const node = nodes.find(n => n.id === selectedId);
    if (!node) return;
    const newId = `n${Date.now()}`;
    const newNode: WFNode = { ...node, id: newId, x: node.x + 50, y: node.y + 50 };
    const next = [...nodes, newNode];
    pushHistory(next);
    setSelectedId(newId);
    setIsDirty(true);
    toast(t('节点已复制', 'Node duplicated'));
  };

  const handleClearAll = () => {
    pushHistory([]);
    setSelectedId(null);
    setConfigOpen(false);
    setIsDirty(true);
    toast(t('所有节点已清空', 'All nodes cleared'));
  };

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
      const next = nodes.map(n =>
        n.id === dragging.current!.nodeId ? { ...n, x: dragging.current!.nx + dx, y: dragging.current!.ny + dy } : n
      );
      setNodesBase(next);
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
    const next = nodes.map(n => n.id === selectedId ? { ...n, config: { ...n.config, [key]: val } } : n);
    setNodesBase(next);
    setIsDirty(true);
  };

  const addNode = (type: NodeType) => {
    const meta = nodeMetaMap[type];
    const id = `n${Date.now()}`;
    // Check trigger uniqueness
    if (type === 'incoming_call' && nodes.some(n => n.type === 'incoming_call')) {
      toast.error(t('流程已有触发器，不可重复添加', 'Flow already has a trigger'));
      return;
    }
    const next = [...nodes, { id, type, category: meta.category, x: 200, y: 200, label: t(meta.zh, meta.en), config: {} }];
    pushHistory(next);
    setIsDirty(true);
    toast(t('节点已添加', 'Node added'));
  };

  const validateFlow = (): string[] => {
    const errors: string[] = [];
    if (nodes.length === 0) { errors.push(t('流程为空，请添加节点', 'Flow is empty')); return errors; }
    if (!nodes.some(n => n.type === 'incoming_call')) errors.push(t('缺少来电触发器', 'Missing trigger node'));
    if (!nodes.some(n => n.type === 'end_call')) errors.push(t('缺少通话结束节点', 'Missing end call node'));
    nodes.forEach(n => {
      if (n.type === 'incoming_call') return;
      const hasInput = connections.some(c => c.toId === n.id);
      if (!hasInput) errors.push(t(`节点"${n.label}"未连接`, `Node "${n.label}" is disconnected`));
    });
    return errors;
  };

  const handleSave = () => {
    const errors = validateFlow();
    if (errors.length > 0) { toast.error(errors[0]); return; }
    setIsDirty(false);
    toast.success(t('保存成功', 'Saved successfully'));
  };

  const handlePublish = () => {
    const errors = validateFlow();
    if (errors.length > 0) { toast.error(errors[0]); return; }
    toast.success(t('发布成功', 'Published successfully'));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Node Library */}
      <aside className="flex flex-col flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto" style={{ width: 220 }}>
        <div className="px-4 py-3 border-b border-gray-100" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          {t('节点库', 'Node Library')}
        </div>
        <div className="flex-1 overflow-y-auto">
          {paletteCategories.map(cat => (
            <div key={cat.category}>
              <div className="px-4 py-2 mt-1" style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t(categoryMeta[cat.category].zh, categoryMeta[cat.category].en)}
              </div>
              <div className="px-2 pb-1 space-y-0.5">
                {cat.nodes.map(nt => {
                  const meta = nodeMetaMap[nt];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={nt}
                      onClick={() => addNode(nt)}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md border text-left transition-all hover:shadow-sm"
                      style={{ background: meta.bg, borderColor: meta.border, cursor: 'grab' }}
                    >
                      <Icon size={15} color={meta.color} strokeWidth={2} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>{t(meta.zh, meta.en)}</span>
                      <GripVertical size={13} color="#9ca3af" className="ml-auto" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-gray-100" style={{ fontSize: '11px', color: '#9ca3af' }}>
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
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-sm transition hover:bg-red-50"
            style={{ color: '#ef4444' }}
          >
            <Trash2 size={14} />
            {t('清空', 'Clear All')}
          </button>
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
                const label = (conn.fromPort === 'yes' || conn.fromPort === 'branch_true' || conn.fromPort === 'branch_open') ? (t('是/营业', 'Yes/Open')) : (conn.fromPort === 'no' || conn.fromPort === 'branch_false' || conn.fromPort === 'branch_closed') ? (t('否/关闭', 'No/Closed')) : '';
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
              const meta = nodeMetaMap[node.type];
              const Icon = meta.icon;
              const selected = selectedId === node.id;
              const hasInput = node.type !== 'incoming_call';
              const hasOutput = node.type !== 'end_call';
              const multiPort = node.type === 'branch' || node.type === 'business_hours' || node.type === 'call_type' || node.type === 'if_else';
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
                  {hasInput && (
                    <div style={{
                      position: 'absolute', left: -6, top: NODE_H / 2 - 6, width: 12, height: 12,
                      borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                    }} />
                  )}

                  {/* Node header */}
                  <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                    <Icon size={13} color={meta.color} strokeWidth={2} />
                    <span style={{ fontSize: '11px', color: meta.color, fontWeight: 600 }}>{t(meta.zh, meta.en)}</span>
                  </div>
                  <div className="px-3 pb-2" style={{ fontSize: '13px', color: '#1f2937', fontWeight: 500 }}>
                    {node.label}
                  </div>

                  {/* Output ports */}
                  {hasOutput && (multiPort ? (
                    <>
                      <div title={t('是/True', 'Yes/True')} style={{
                        position: 'absolute', right: -6, top: NODE_H / 3 - 6, width: 12, height: 12,
                        borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                      }} />
                      <div title={t('否/False', 'No/False')} style={{
                        position: 'absolute', right: -6, top: 2 * NODE_H / 3 - 6, width: 12, height: 12,
                        borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                      }} />
                    </>
                  ) : (
                    <div style={{
                      position: 'absolute', right: -6, top: NODE_H / 2 - 6, width: 12, height: 12,
                      borderRadius: '50%', background: '#fff', border: `2px solid ${meta.color}`,
                    }} />
                  ))}
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
              {(() => { const Icon = nodeMetaMap[selectedNode.type].icon; return <Icon size={16} color={nodeMetaMap[selectedNode.type].color} strokeWidth={2} />; })()}
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
            {/* Node actions */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <button
                onClick={() => { deleteNode(); setConfigOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-xs hover:bg-red-50"
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={12} />{t('删除节点', 'Delete Node')}
              </button>
              <button
                onClick={() => duplicateNode()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-xs hover:bg-gray-50"
                style={{ color: '#374151' }}
              >
                <Copy size={12} />{t('复制节点', 'Duplicate')}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => undo()}
                className="p-1.5 rounded hover:bg-gray-100"
                title={t('撤销', 'Undo')}
                disabled={historyIndex <= 0}
                style={{ opacity: historyIndex <= 0 ? 0.3 : 1 }}
              >
                <Undo2 size={14} color="#374151" />
              </button>
              <button
                onClick={() => redo()}
                className="p-1.5 rounded hover:bg-gray-100"
                title={t('重做', 'Redo')}
                disabled={historyIndex >= history.length - 1}
                style={{ opacity: historyIndex >= history.length - 1 ? 0.3 : 1 }}
              >
                <Redo2 size={14} color="#374151" />
              </button>
            </div>
            {/* Trigger: incoming_call */}
            {selectedNode.type === 'incoming_call' && (
              <>
                <FormField label={t('适用号码', 'Phone Number')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.phone_number || '所有号码'}
                    onChange={e => updateConfig('phone_number', e.target.value)}
                  >
                    <option>{t('所有号码', 'All Numbers')}</option>
                    <option>+861012345678</option>
                  </select>
                </FormField>
                <FormField label={t('静音接听', 'Mute Answer')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.mute_answer || '否'}
                    onChange={e => updateConfig('mute_answer', e.target.value)}
                  >
                    <option>{t('否', 'No')}</option>
                    <option>{t('是', 'Yes')}</option>
                  </select>
                </FormField>
              </>
            )}

            {/* Action: greeting */}
            {selectedNode.type === 'greeting' && (
              <>
                <FormField label={t('问候语文本', 'Greeting Text')} required>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.greeting_text || ''}
                    onChange={e => updateConfig('greeting_text', e.target.value)}
                    placeholder={t('您好，欢迎致电{{company_name}}', 'Hello, welcome to {{company_name}}')}
                  />
                  <button className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700">
                    <Volume2 size={12} />{t('试听', 'Preview')}
                  </button>
                </FormField>
                <FormField label={t('语音选择', 'Voice')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.voice || 'Female · Gentle'}
                    onChange={e => updateConfig('voice', e.target.value)}
                  >
                    <option value="Female · Gentle">{t('女声-温柔', 'Female · Gentle')}</option>
                    <option value="Male · Professional">{t('男声-专业', 'Male · Professional')}</option>
                    <option value="Female · Lively">{t('女声-活泼', 'Female · Lively')}</option>
                  </select>
                </FormField>
                <FormField label={t('语速', 'Speed')}>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0.8" max="1.2" step="0.1" value={parseFloat(selectedNode.config.speed || '1.0').toFixed(1) === '0.8' ? 0.8 : parseFloat(selectedNode.config.speed || '1.0').toFixed(1) === '1.2' ? 1.2 : 1.0}
                      onChange={e => updateConfig('speed', `${e.target.value}x`)} className="flex-1" />
                    <span style={{ fontSize: '13px', color: '#374151', minWidth: 36 }}>{selectedNode.config.speed || '1.0x'}</span>
                  </div>
                </FormField>
              </>
            )}

            {/* Action: question */}
            {selectedNode.type === 'question' && (
              <>
                <FormField label={t('问题文本', 'Question Text')} required>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.question_text || ''}
                    onChange={e => updateConfig('question_text', e.target.value)}
                    placeholder={t('请问您是要咨询、预约还是投诉？', 'Are you here to inquire, book, or complain?')}
                  />
                </FormField>
                <FormField label={t('输入方式', 'Input Method')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.input_method || 'Both'}
                    onChange={e => updateConfig('input_method', e.target.value)}
                  >
                    <option value="Speech">{t('语音', 'Speech')}</option>
                    <option value="DTMF">{t('按键', 'DTMF')}</option>
                    <option value="Both">{t('两者', 'Both')}</option>
                  </select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t('最大等待', 'Max Wait')}>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                      value={selectedNode.config.max_wait || '10s'}
                      onChange={e => updateConfig('max_wait', e.target.value)}
                    >
                      <option value="5s">{t('5秒', '5s')}</option><option value="10s">{t('10秒', '10s')}</option><option value="15s">{t('15秒', '15s')}</option>
                    </select>
                  </FormField>
                  <FormField label={t('重试次数', 'Retries')}>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                      value={selectedNode.config.retries || '2 times'}
                      onChange={e => updateConfig('retries', e.target.value)}
                    >
                      <option value="1 time">{t('1次', '1 time')}</option><option value="2 times">{t('2次', '2 times')}</option><option value="3 times">{t('3次', '3 times')}</option>
                    </select>
                  </FormField>
                </div>
                <FormField label={t('超时话术', 'Timeout Message')}>
                  <textarea rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.timeout_msg || ''}
                    onChange={e => updateConfig('timeout_msg', e.target.value)}
                    placeholder={t('抱歉，未听清您的回答', 'Sorry, I didn\'t catch that')}
                  />
                </FormField>
              </>
            )}

            {/* Action: collect_info */}
            {selectedNode.type === 'collect_info' && (
              <>
                <FormField label={t('收集字段', 'Fields to Collect')} required>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.fields || ''}
                    onChange={e => updateConfig('fields', e.target.value)}
                    placeholder={t('name:姓名:必填\nphone:电话:必填', 'name:Name:required\nphone:Phone:required')}
                  />
                </FormField>
                <FormField label={t('确认话术', 'Confirmation Message')}>
                  <textarea rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.confirm_msg || ''}
                    onChange={e => updateConfig('confirm_msg', e.target.value)}
                    placeholder={t('我确认一下，您是{{name}}，对吗？', 'Let me confirm: you are {{name}}, correct?')}
                  />
                </FormField>
              </>
            )}

            {/* Action: transfer_call */}
            {selectedNode.type === 'transfer_call' && (
              <>
                <FormField label={t('转接方式', 'Transfer Type')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.transfer_type || 'Warm Transfer'}
                    onChange={e => updateConfig('transfer_type', e.target.value)}
                  >
                    <option value="Warm Transfer">{t('暖转接', 'Warm Transfer')}</option>
                    <option value="Cold Transfer">{t('冷转接', 'Cold Transfer')}</option>
                  </select>
                </FormField>
                <FormField label={t('目标号码/坐席', 'Target Number/Agent')} required>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.target || ''}
                    onChange={e => updateConfig('target', e.target.value)}
                    placeholder="+861012345678"
                  />
                </FormField>
                <FormField label={t('转接前话术', 'Transfer Message')}>
                  <textarea rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.wait_msg || ''}
                    onChange={e => updateConfig('wait_msg', e.target.value)}
                    placeholder={t('正在为您转接，请稍候...', 'Transferring, please wait...')}
                  />
                </FormField>
              </>
            )}

            {/* Action: send_sms */}
            {selectedNode.type === 'send_sms' && (
              <>
                <FormField label={t('收件人', 'Recipient')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.recipient || 'Caller Number'}
                    onChange={e => updateConfig('recipient', e.target.value)}
                  >
                    <option value="Caller Number">{t('来电号码', 'Caller Number')}</option>
                    <option value="Fixed Number">{t('固定号码', 'Fixed Number')}</option>
                  </select>
                </FormField>
                <FormField label={t('短信模板', 'SMS Template')}>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.template || ''}
                    onChange={e => updateConfig('template', e.target.value)}
                    placeholder={t('感谢您的来电，预约已确认：{{appointment_date}}', 'Thank you, your appointment {{appointment_date}} is confirmed')}
                  />
                </FormField>
              </>
            )}

            {/* Action: end_call */}
            {selectedNode.type === 'end_call' && (
              <>
                <FormField label={t('结束语文本', 'End Message')}>
                  <textarea rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.end_msg || ''}
                    onChange={e => updateConfig('end_msg', e.target.value)}
                    placeholder={t('感谢您的来电，再见！', 'Thank you for calling, goodbye!')}
                  />
                </FormField>
                <FormField label={t('通话后短信', 'Post-call SMS')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.send_sms || '否'}
                    onChange={e => updateConfig('send_sms', e.target.value)}
                  >
                    <option>{t('否', 'No')}</option>
                    <option>{t('是', 'Yes')}</option>
                  </select>
                </FormField>
              </>
            )}

            {/* Logic: branch, if_else */}
            {(selectedNode.type === 'branch' || selectedNode.type === 'if_else') && (
              <>
                <FormField label={t('判断变量', 'Variable')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.variable || 'intent'}
                    onChange={e => updateConfig('variable', e.target.value)}
                  >
                    <option value="intent">{t('意图', 'Intent')}</option>
                    <option value="caller_type">{t('来电类型', 'Caller Type')}</option>
                    <option value="custom">{t('自定义', 'Custom')}</option>
                  </select>
                </FormField>
                <FormField label={t('条件列表', 'Conditions')}>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.conditions || ''}
                    onChange={e => updateConfig('conditions', e.target.value)}
                    placeholder={t('咨询=咨询分支\n预约=预约分支', 'inquiry=inquiry_branch\nbooking=booking_branch')}
                  />
                </FormField>
                <FormField label={t('默认分支', 'Default Branch')}>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.default || '其他'}
                    onChange={e => updateConfig('default', e.target.value)}
                  />
                </FormField>
              </>
            )}

            {/* Logic: business_hours */}
            {selectedNode.type === 'business_hours' && (
              <>
                <FormField label={t('营业时间', 'Schedule')}>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.schedule || ''}
                    onChange={e => updateConfig('schedule', e.target.value)}
                    placeholder={t('周一至五 09:00-18:00\n周六 10:00-14:00', 'Mon-Fri 09:00-18:00\nSat 10:00-14:00')}
                  />
                </FormField>
                <FormField label={t('时区', 'Timezone')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.timezone || 'Asia/Shanghai'}
                    onChange={e => updateConfig('timezone', e.target.value)}
                  >
                    <option>Asia/Shanghai</option><option>America/New_York</option><option>Europe/London</option>
                  </select>
                </FormField>
              </>
            )}

            {/* Logic: call_type */}
            {selectedNode.type === 'call_type' && (
              <>
                <FormField label={t('客户数据源', 'Data Source')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.data_source || '无'}
                    onChange={e => updateConfig('data_source', e.target.value)}
                  >
                    <option>{t('无', 'None')}</option>
                    <option>{t('内置CRM', 'Built-in CRM')}</option>
                    <option>HubSpot</option><option>Salesforce</option>
                  </select>
                </FormField>
                <FormField label={t('黑名单行为', 'Blacklist Action')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.blacklist_action || '直接挂断'}
                    onChange={e => updateConfig('blacklist_action', e.target.value)}
                  >
                    <option>{t('直接挂断', 'Hang Up')}</option>
                    <option>{t('播放提示后挂断', 'Play Message + Hang Up')}</option>
                    <option>{t('转特殊坐席', 'Transfer to Special')}</option>
                  </select>
                </FormField>
              </>
            )}

            {/* Integration types */}
            {selectedNode.type === 'crm_lookup' && (
              <>
                <FormField label={t('CRM类型', 'CRM Type')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.crm_type || 'HubSpot'}
                    onChange={e => updateConfig('crm_type', e.target.value)}
                  >
                    <option>HubSpot</option><option>Salesforce</option><option>{t('自定义API', 'Custom API')}</option>
                  </select>
                </FormField>
                <FormField label={t('查询字段', 'Query Field')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.query_field || 'Caller Number'}
                    onChange={e => updateConfig('query_field', e.target.value)}
                  >
                    <option value="Caller Number">{t('来电号码', 'Caller Number')}</option>
                    <option value="Name">{t('姓名', 'Name')}</option>
                    <option value="ID">ID</option>
                  </select>
                </FormField>
              </>
            )}

            {selectedNode.type === 'calendar_booking' && (
              <>
                <FormField label={t('日历类型', 'Calendar Type')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.calendar_type || 'Google Calendar'}
                    onChange={e => updateConfig('calendar_type', e.target.value)}
                  >
                    <option>Google Calendar</option><option>Cal.com</option><option>{t('自定义', 'Custom')}</option>
                  </select>
                </FormField>
                <FormField label={t('预订时长', 'Duration')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.duration || '30 min'}
                    onChange={e => updateConfig('duration', e.target.value)}
                  >
                    <option value="15 min">{t('15分钟', '15 min')}</option><option value="30 min">{t('30分钟', '30 min')}</option><option value="60 min">{t('60分钟', '60 min')}</option>
                  </select>
                </FormField>
              </>
            )}

            {selectedNode.type === 'send_notification' && (
              <>
                <FormField label={t('通知渠道', 'Channel')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.channel || 'Slack'}
                    onChange={e => updateConfig('channel', e.target.value)}
                  >
                    <option>Slack</option><option>Email</option><option>{t('企业微信', 'WeCom')}</option><option>{t('钉钉', 'DingTalk')}</option>
                  </select>
                </FormField>
                <FormField label={t('通知模板', 'Template')}>
                  <textarea rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.template || ''}
                    onChange={e => updateConfig('template', e.target.value)}
                    placeholder={t('新来电：{{caller_number}}，意图：{{intent}}', 'New call: {{caller_number}}, Intent: {{intent}}')}
                  />
                </FormField>
              </>
            )}

            {selectedNode.type === 'webhook' && (
              <>
                <FormField label="URL" required>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.url || ''}
                    onChange={e => updateConfig('url', e.target.value)}
                    placeholder="https://api.example.com/webhook"
                  />
                </FormField>
                <FormField label={t('HTTP方法', 'HTTP Method')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.method || 'POST'}
                    onChange={e => updateConfig('method', e.target.value)}
                  >
                    <option>POST</option><option>GET</option><option>PUT</option>
                  </select>
                </FormField>
              </>
            )}

            {/* AI types */}
            {selectedNode.type === 'intent_detection' && (
              <>
                <FormField label={t('意图列表', 'Intents')} required>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.intents || ''}
                    onChange={e => updateConfig('intents', e.target.value)}
                    placeholder={t('咨询:一般咨询:我想了解一下\n预约:预约服务:我想预约', 'inquiry:General inquiry:I want to know\nbooking:Book service:I want to book')}
                  />
                </FormField>
                <FormField label={t('置信度阈值', 'Confidence Threshold')}>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0.5" max="0.9" step="0.1" className="flex-1"
                      value={parseFloat(selectedNode.config.threshold || '0.7')}
                      onChange={e => updateConfig('threshold', e.target.value)}
                    />
                    <span style={{ fontSize: '13px', color: '#374151', minWidth: 36 }}>{selectedNode.config.threshold || '0.7'}</span>
                  </div>
                </FormField>
              </>
            )}

            {selectedNode.type === 'knowledge_qa' && (
              <>
                <FormField label={t('知识库', 'Knowledge Base')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.kb_id || 'FAQ知识库'}
                    onChange={e => updateConfig('kb_id', e.target.value)}
                  >
                    <option>{t('FAQ知识库', 'FAQ KB')}</option>
                    <option>{t('产品手册', 'Product Manual')}</option>
                    <option>{t('政策文档', 'Policy Docs')}</option>
                  </select>
                </FormField>
                <FormField label={t('回答风格', 'Answer Style')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.style || '简洁'}
                    onChange={e => updateConfig('style', e.target.value)}
                  >
                    <option>{t('简洁', 'Concise')}</option>
                    <option>{t('详细', 'Detailed')}</option>
                    <option>{t('口语化', 'Casual')}</option>
                  </select>
                </FormField>
              </>
            )}

            {selectedNode.type === 'call_summary' && (
              <>
                <FormField label={t('摘要格式', 'Summary Format')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.format || '简洁'}
                    onChange={e => updateConfig('format', e.target.value)}
                  >
                    <option>{t('简洁', 'Concise')}</option>
                    <option>{t('详细', 'Detailed')}</option>
                  </select>
                </FormField>
                <FormField label={t('提取待办事项', 'Extract TODOs')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.include_todos || '是'}
                    onChange={e => updateConfig('include_todos', e.target.value)}
                  >
                    <option>{t('是', 'Yes')}</option>
                    <option>{t('否', 'No')}</option>
                  </select>
                </FormField>
              </>
            )}

            {/* wait, log_info (simple) */}
            {selectedNode.type === 'wait' && (
              <FormField label={t('等待时间(秒)', 'Wait Duration (s)')}>
                <input type="number" min="1" max="60" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                  value={selectedNode.config.duration || 3}
                  onChange={e => updateConfig('duration', parseInt(e.target.value))}
                />
              </FormField>
            )}

            {selectedNode.type === 'log_info' && (
              <>
                <FormField label={t('记录类型', 'Record Type')}>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.record_type || 'Call Log'}
                    onChange={e => updateConfig('record_type', e.target.value)}
                  >
                    <option value="Call Log">{t('通话日志', 'Call Log')}</option>
                    <option value="Customer Info">{t('客户信息', 'Customer Info')}</option>
                    <option value="Booking Info">{t('预约信息', 'Booking Info')}</option>
                  </select>
                </FormField>
                <FormField label={t('字段映射', 'Field Mapping')}>
                  <textarea rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-indigo-500" style={{ fontSize: '13px' }}
                    value={selectedNode.config.fields || ''}
                    onChange={e => updateConfig('fields', e.target.value)}
                    placeholder={t('caller_name→customer_name', 'caller_name→customer_name')}
                  />
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
