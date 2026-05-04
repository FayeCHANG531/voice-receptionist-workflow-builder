import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import {
  Send, Phone, PhoneOff, MessageSquare, HelpCircle,
  GitBranch, Zap, CheckCircle, Clock, AlertCircle,
  ChevronDown, Mic, Volume2, Play, ArrowRight, RotateCcw, Trash2, Download
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  contentZh: string;
  contentEn: string;
  time: string;
  nodeId?: string;
  nodeTagZh?: string;
  nodeTagEn?: string;
  highlight?: boolean;
}

const initialMessages: ChatMessage[] = [
  { id: 'm1', role: 'ai', contentZh: '您好！感谢您致电VoiceFlow AI接待服务，请问有什么可以帮助您？', contentEn: 'Hello! Thank you for calling VoiceFlow AI. How can I help you?', time: '10:23:01', nodeId: 'n1', nodeTagZh: '欢迎语', nodeTagEn: 'Welcome' },
  { id: 'm2', role: 'user', contentZh: '你好，我想预约下周三的理发服务', contentEn: 'Hi, I would like to book a haircut for next Wednesday', time: '10:23:15' },
  { id: 'm3', role: 'ai', contentZh: '好的！请问您是我们的会员吗？如果是，请告知您的会员号码。', contentEn: 'Sure! Are you a member? If so, please provide your membership number.', time: '10:23:18', nodeId: 'n2', nodeTagZh: '身份验证', nodeTagEn: 'ID Verify' },
  { id: 'm4', role: 'user', contentZh: '是的，我的会员号是 VIP12345', contentEn: 'Yes, my membership number is VIP12345', time: '10:23:35' },
  { id: 'm5', role: 'ai', contentZh: '已成功验证您的会员身份，张先生。请问下周三哪个时间段您方便？', contentEn: 'Your membership has been verified, Mr. Zhang. What time next Wednesday works for you?', time: '10:23:38', nodeId: 'n3', nodeTagZh: '意图判断', nodeTagEn: 'Intent Analysis' },
  { id: 'm6', role: 'ai', contentZh: '已检测到关键词"预约"，跳转至预约服务流程', contentEn: 'Keyword "booking" detected, routing to booking service', time: '10:23:39', nodeId: 'n3', nodeTagZh: '关键词匹配', nodeTagEn: 'Keyword Match', highlight: true },
];

const executedNodes = [
  { id: 'n1', type: 'greeting', labelZh: '问候语', labelEn: 'Greeting', detailZh: 'greeting_01 · 输出语音提示', detailEn: 'greeting_01 · Play voice prompt', status: 'completed', time: '10:23:01' },
  { id: 'n2', type: 'question', labelZh: '身份验证', labelEn: 'ID Verification', detailZh: 'verify_01 · 等待会员号输入', detailEn: 'verify_01 · Awaiting membership ID', status: 'completed', time: '10:23:18' },
  { id: 'n3', type: 'branch', labelZh: '意图判断', labelEn: 'Intent Analysis', detailZh: 'intent_01 · 识别关键词', detailEn: 'intent_01 · Keyword detection', status: 'completed', time: '10:23:38' },
  { id: 'n4', type: 'api', labelZh: '预约服务', labelEn: 'Booking Service', detailZh: 'booking_01 · 查询可预约时段', detailEn: 'booking_01 · Query available slots', status: 'active', time: '10:23:45' },
  { id: 'n5', type: 'endCall', labelZh: '结束', labelEn: 'End', detailZh: 'end_01 · 挂断并记录', detailEn: 'end_01 · Hang up & log', status: 'pending', time: '' },
];

const nodeIconMap: Record<string, React.ElementType> = {
  greeting: MessageSquare,
  question: HelpCircle,
  branch: GitBranch,
  api: Zap,
  wait: Clock,
  endCall: CheckCircle,
};

const nodeColorMap: Record<string, string> = {
  greeting: '#4f46e5',
  question: '#2563eb',
  branch: '#d97706',
  api: '#7c3aed',
  wait: '#6b7280',
  endCall: '#16a34a',
};

const flows = [
  { id: 'f1', nameZh: '客服接待流程 v2 (当前)', nameEn: 'Customer Service Flow v2 (Current)' },
  { id: 'f2', nameZh: '预约服务流程 v1', nameEn: 'Booking Service Flow v1' },
  { id: 'f3', nameZh: '投诉处理流程 v1', nameEn: 'Complaint Handling Flow v1' },
];

export default function SimulationTest() {
  const { t, lang } = useLang();
  const [mode, setMode] = useState<'text' | 'live'>('text');
  const [selectedFlow, setSelectedFlow] = useState('f1');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputVal, setInputVal] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'active' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const timeLocale = lang === 'zh' ? 'zh-CN' : 'en-US';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (callStatus === 'active') {
      timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const sendMessage = () => {
    if (!inputVal.trim()) return;
    const userMsg: ChatMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      contentZh: inputVal,
      contentEn: inputVal,
      time: new Date().toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setMessages(msgs => [...msgs, userMsg]);
    setInputVal('');
    setTimeout(() => {
      const nodeTags = [
        { zh: '预约确认', en: 'Booking Confirm' },
        { zh: 'AI助手', en: 'AI Assistant' },
        { zh: '信息查询', en: 'Info Query' },
        { zh: '对话节点', en: 'Dialog' },
      ];
      const tag = nodeTags[Math.floor(Math.random() * nodeTags.length)];
      const aiMsg: ChatMessage = {
        id: `m${Date.now()}`,
        role: 'ai',
        contentZh: '好的，我帮您预约下周三上午10点。请问您有其他需要吗？',
        contentEn: "Sure, I've booked next Wednesday at 10 AM. Anything else?",
        time: new Date().toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        nodeId: 'n4',
        nodeTagZh: tag.zh,
        nodeTagEn: tag.en,
      };
      setMessages(msgs => [...msgs, aiMsg]);
    }, 1000);
  };

  const resetChat = () => {
    setMessages(initialMessages);
    setInputVal('');
    toast(t('对话已重置', 'Chat reset'));
  };

  const clearChat = () => {
    setMessages([]);
    setInputVal('');
    toast(t('对话已清空', 'Chat cleared'));
  };

  const exportTranscript = () => {
    const text = messages.map(m =>
      `[${m.time}] ${m.role === 'ai' ? 'AI' : 'User'}: ${t(m.contentZh, m.contentEn)}`
    ).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success(t('对话记录已复制', 'Transcript copied to clipboard'));
  };

  const startCall = () => {
    setCallStatus('ringing');
    setTimeout(() => setCallStatus('active'), 2000);
  };

  const endCall = () => {
    setCallStatus('ended');
  };

  const fmtDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top: mode + flow selector */}
      <div className="flex items-center gap-4 px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Mode tabs */}
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          <button
            onClick={() => setMode('text')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm transition"
            style={{ background: mode === 'text' ? '#4f46e5' : '#fff', color: mode === 'text' ? '#fff' : '#374151' }}
          >
            <MessageSquare size={14} />
            {t('文字模拟', 'Text Simulation')}
          </button>
          <button
            onClick={() => setMode('live')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm transition border-l border-gray-200"
            style={{ background: mode === 'live' ? '#4f46e5' : '#fff', color: mode === 'live' ? '#fff' : '#374151' }}
          >
            <Phone size={14} />
            {t('真实通话模拟', 'Live Call Test')}
          </button>
        </div>

        {/* Flow selector */}
        <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#6b7280' }}>
          <span>{t('选择流程:', 'Select Flow:')}</span>
          <div className="relative">
            <select
              value={selectedFlow}
              onChange={e => setSelectedFlow(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 bg-white"
              style={{ fontSize: '13px', color: '#374151' }}
            >
              {flows.map(f => <option key={f.id} value={f.id}>{t(f.nameZh, f.nameEn)}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" color="#6b7280" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat / Live Call */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-gray-200" style={{ flex: '0 0 60%' }}>
          {mode === 'text' ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: '#f8f9fa' }}>
                {/* Chat actions */}
                {messages.length > 0 && (
                  <div className="flex items-center justify-end gap-1.5 mb-2">
                    <button onClick={resetChat} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-gray-200" style={{ color: '#6b7280' }} title={t('重置为初始对话', 'Reset to initial')}>
                      <RotateCcw size={11} />{t('重置', 'Reset')}
                    </button>
                    <button onClick={clearChat} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-red-50" style={{ color: '#ef4444' }} title={t('清空所有对话', 'Clear all')}>
                      <Trash2 size={11} />{t('清空', 'Clear')}
                    </button>
                    <button onClick={exportTranscript} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-gray-200" style={{ color: '#6b7280' }} title={t('导出对话', 'Export transcript')}>
                      <Download size={11} />{t('导出', 'Export')}
                    </button>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div style={{ maxWidth: '70%' }}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: '#4f46e5' }}>AI</div>
                          {(msg.nodeTagZh || msg.nodeTagEn) && (
                            <span className="px-1.5 py-px rounded text-white font-semibold" style={{ fontSize: '10px', background: '#4f46e5' }}>
                              {t(msg.nodeTagZh || '', msg.nodeTagEn || '')}
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{msg.time}</span>
                        </div>
                      )}
                      <div
                        className="px-3 py-2 rounded-lg"
                        style={{
                          background: msg.highlight ? '#dcfce7' : msg.role === 'ai' ? '#fff' : '#4f46e5',
                          color: msg.highlight ? '#166534' : msg.role === 'ai' ? '#1f2937' : '#fff',
                          border: msg.highlight ? 'none' : msg.role === 'ai' ? '1px solid #e5e7eb' : 'none',
                          borderLeft: msg.highlight ? '3px solid #22c55e' : undefined,
                          fontSize: '13px',
                          lineHeight: '1.5',
                        }}
                      >
                        {t(msg.contentZh, msg.contentEn)}
                      </div>
                      {msg.role === 'user' && (
                        <div className="text-right mt-1">
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{msg.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200">
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={t('输入您的回答...', 'Type your answer...')}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                  style={{ fontSize: '13px' }}
                />
                <button
                  onClick={sendMessage}
                  className="w-9 h-9 flex items-center justify-center rounded-md text-white"
                  style={{ background: '#4f46e5' }}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            /* Live Call Mode */
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6" style={{ background: '#f8f9fa' }}>
              {callStatus === 'idle' && (
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ background: '#eef2ff', border: '2px dashed #a5b4fc' }}>
                    <Phone size={40} color="#4f46e5" />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{t('测试通话号码', 'Test Number')}</p>
                    <p style={{ fontSize: '24px', fontWeight: 700, color: '#4f46e5', marginTop: 4 }}>+1 (415) 555-0199</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: 4 }}>{t('有效期', 'Valid for')} 30:00</p>
                  </div>
                  <button
                    onClick={startCall}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium"
                    style={{ background: '#22c55e' }}
                  >
                    <Phone size={16} />
                    {t('拨打测试', 'Start Call')}
                  </button>
                </div>
              )}

              {callStatus === 'ringing' && (
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto animate-pulse" style={{ background: '#fef3c7' }}>
                    <Phone size={40} color="#d97706" />
                  </div>
                  <p style={{ fontSize: '16px', color: '#d97706', fontWeight: 600 }}>{t('振铃中...', 'Ringing...')}</p>
                </div>
              )}

              {callStatus === 'active' && (
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ background: '#dcfce7' }}>
                    <Mic size={40} color="#16a34a" />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', color: '#16a34a', fontWeight: 600 }}>{t('通话中', 'In Call')}</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(callDuration)}</p>
                  </div>
                  <button
                    onClick={endCall}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium"
                    style={{ background: '#ef4444' }}
                  >
                    <PhoneOff size={16} />
                    {t('挂断', 'End Call')}
                  </button>
                </div>
              )}

              {callStatus === 'ended' && (
                <div className="w-full max-w-md space-y-3">
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', textAlign: 'center' }}>{t('通话结束', 'Call Ended')}</p>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t('通话时长', 'Duration'), value: `1m ${callDuration}s` },
                      { label: t('经过节点', 'Nodes'), value: '5' },
                      { label: t('平均延迟', 'Avg Latency'), value: '142ms' },
                      { label: t('识别准确率', 'ASR Accuracy'), value: '96.5%' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-3">
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: 4 }}>{stat.label}</p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Recording */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100" style={{ fontSize: '13px', fontWeight: 600 }}>{t('通话录音', 'Recording')}</div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#eef2ff' }}>
                          <Play size={14} color="#4f46e5" />
                        </button>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full rounded-full" style={{ width: '45%', background: '#4f46e5' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>0:42 / 1:{callDuration}</span>
                      </div>
                    </div>
                  </div>
                  {/* Transcript */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100" style={{ fontSize: '13px', fontWeight: 600 }}>{t('通话转写', 'Transcript')}</div>
                    <div className="px-4 py-3 space-y-1.5" style={{ fontSize: '12px', lineHeight: 1.7, color: '#475569' }}>
                      <div><strong style={{ color: '#4f46e5' }}>{t('[系统]', '[System]')}</strong> {t('您好，欢迎致电语流科技...', 'Hello, welcome to VoiceFlow...')}</div>
                      <div><strong style={{ color: '#22c55e' }}>{t('[用户]', '[User]')}</strong> {t('你好，我想咨询一下', 'Hi, I\'d like to ask...')}</div>
                      <div><strong style={{ color: '#4f46e5' }}>{t('[系统]', '[System]')}</strong> {t('好的，请问有什么可以帮您？', 'Sure, how can I help?')}</div>
                      <div><strong style={{ color: '#22c55e' }}>{t('[用户]', '[User]')}</strong> {t('我想预约下周的服务', 'I want to book next week')}</div>
                    </div>
                  </div>
                  {/* Node path chips */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100" style={{ fontSize: '13px', fontWeight: 600 }}>{t('节点路径', 'Node Path')}</div>
                    <div className="px-4 py-3 flex items-center gap-1.5 flex-wrap">
                      {[t('欢迎语', 'Greeting'), t('IVR菜单', 'IVR Menu'), t('语音识别', 'ASR'), t('预约处理', 'Booking'), t('结束', 'End')].map((node, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <ArrowRight size={12} color="#94a3b8" />}
                          <span
                            className="px-2.5 py-1 rounded"
                            style={{
                              fontSize: '11px',
                              background: i === 4 ? '#f1f5f9' : i === 2 ? '#fef3c7' : '#dcfce7',
                              color: i === 4 ? '#64748b' : i === 2 ? '#92400e' : '#166534',
                            }}
                          >
                            {node}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Node path */}
        <div className="flex flex-col overflow-hidden bg-white" style={{ flex: '0 0 40%' }}>
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{t('节点路径', 'Node Path')}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5" style={{ background: '#e5e7eb' }} />

              {executedNodes.map((node, i) => {
                const Icon = nodeIconMap[node.type] || CheckCircle;
                const color = nodeColorMap[node.type] || '#6b7280';
                const isDone = node.status === 'completed';
                const isActive = node.status === 'active';
                return (
                  <div key={node.id} className="flex items-start gap-3 mb-4 relative">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                      style={{
                        background: isDone ? color : isActive ? '#eef2ff' : '#f9fafb',
                        border: `2px solid ${isDone ? color : isActive ? '#4f46e5' : '#e5e7eb'}`,
                      }}
                    >
                      <Icon size={16} color={isDone ? '#fff' : isActive ? '#4f46e5' : '#9ca3af'} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '13px', fontWeight: 500, color: isDone ? '#111827' : isActive ? '#4f46e5' : '#9ca3af' }}>
                          {t(node.labelZh, node.labelEn)}
                        </span>
                        {node.time && (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{node.time}</span>
                        )}
                      </div>
                      {(node as any).detailZh && (
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: 1 }}>{t((node as any).detailZh, (node as any).detailEn)}</p>
                      )}
                      <div className="mt-0.5">
                        {isDone && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <CheckCircle size={10} />{t('已完成', 'Completed')}
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                            <Clock size={10} />{t('进行中', 'In Progress')}
                          </span>
                        )}
                        {node.status === 'pending' && (
                          <span style={{ fontSize: '11px', color: '#d1d5db' }}>{t('等待中', 'Pending')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}