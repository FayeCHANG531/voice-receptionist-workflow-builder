import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../../contexts/LanguageContext';
import {
  Send, Phone, PhoneOff, MessageSquare, HelpCircle,
  GitBranch, Zap, CheckCircle, Clock, AlertCircle,
  ChevronDown, Mic, Volume2, Play
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  time: string;
  nodeId?: string;
}

const initialMessages: ChatMessage[] = [
  { id: 'm1', role: 'ai', content: '您好！感谢您致电VoiceFlow AI接待服务，请问有什么可以帮助您？', time: '10:23:01', nodeId: 'n1' },
  { id: 'm2', role: 'user', content: '你好，我想预约下周三的理发服务', time: '10:23:15' },
  { id: 'm3', role: 'ai', content: '好的！请问您是我们的会员吗？如果是，请告知您的会员号码。', time: '10:23:18', nodeId: 'n2' },
  { id: 'm4', role: 'user', content: '是的，我的会员号是 VIP12345', time: '10:23:35' },
  { id: 'm5', role: 'ai', content: '已成功验证您的会员身份，张先生。请问下周三哪个时间段您方便？', time: '10:23:38', nodeId: 'n3' },
];

const executedNodes = [
  { id: 'n1', type: 'greeting', label: '问候语', labelEn: 'Greeting', status: 'completed', time: '10:23:01' },
  { id: 'n2', type: 'question', label: '身份验证', labelEn: 'Identity Verification', status: 'completed', time: '10:23:18' },
  { id: 'n3', type: 'branch', label: '意图判断', labelEn: 'Intent Analysis', status: 'active', time: '10:23:38' },
  { id: 'n4', type: 'action', label: '预约服务', labelEn: 'Booking Service', status: 'pending', time: '' },
  { id: 'n5', type: 'end', label: '结束', labelEn: 'End', status: 'pending', time: '' },
];

const nodeIconMap: Record<string, React.ElementType> = {
  greeting: MessageSquare,
  question: HelpCircle,
  branch: GitBranch,
  action: Zap,
  wait: Clock,
  end: CheckCircle,
};

const nodeColorMap: Record<string, string> = {
  greeting: '#4f46e5',
  question: '#2563eb',
  branch: '#d97706',
  action: '#7c3aed',
  wait: '#6b7280',
  end: '#16a34a',
};

const flows = [
  { id: 'f1', name: '客服接待流程 v2 (当前)' },
  { id: 'f2', name: '预约服务流程 v1' },
  { id: 'f3', name: '投诉处理流程 v1' },
];

export default function SimulationTest() {
  const { t } = useLang();
  const [mode, setMode] = useState<'text' | 'live'>('text');
  const [selectedFlow, setSelectedFlow] = useState('f1');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputVal, setInputVal] = useState('');
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'active' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      content: inputVal,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setMessages(msgs => [...msgs, userMsg]);
    setInputVal('');
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `m${Date.now()}`,
        role: 'ai',
        content: '好的，我帮您预约下周三上午10点。请问您有其他需要吗？',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        nodeId: 'n4',
      };
      setMessages(msgs => [...msgs, aiMsg]);
    }, 1000);
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
              {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
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
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div style={{ maxWidth: '70%' }}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: '#4f46e5' }}>AI</div>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{msg.time}</span>
                        </div>
                      )}
                      <div
                        className="px-3 py-2 rounded-lg"
                        style={{
                          background: msg.role === 'ai' ? '#fff' : '#4f46e5',
                          color: msg.role === 'ai' ? '#1f2937' : '#fff',
                          border: msg.role === 'ai' ? '1px solid #e5e7eb' : 'none',
                          fontSize: '13px',
                          lineHeight: '1.5',
                        }}
                      >
                        {msg.content}
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
                <div className="w-full max-w-md space-y-4">
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', textAlign: 'center' }}>{t('通话结束', 'Call Ended')}</p>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100" style={{ fontSize: '13px', fontWeight: 600 }}>{t('通话录音', 'Recording')}</div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#eef2ff' }}>
                          <Play size={14} color="#4f46e5" />
                        </button>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className="w-2/3 h-full rounded-full" style={{ background: '#4f46e5' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>1:24</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100" style={{ fontSize: '13px', fontWeight: 600 }}>{t('延迟统计', 'Latency Stats')}</div>
                    <div className="px-4 py-3 grid grid-cols-3 gap-4">
                      {[['ASR', '180ms'], ['LLM', '420ms'], ['TTS', '95ms']].map(([k, v]) => (
                        <div key={k} className="text-center">
                          <p style={{ fontSize: '11px', color: '#6b7280' }}>{k}</p>
                          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{v}</p>
                        </div>
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
                          {t(node.label, node.labelEn)}
                        </span>
                        {node.time && (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{node.time}</span>
                        )}
                      </div>
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