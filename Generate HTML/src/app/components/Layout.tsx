import { Link, useLocation, Outlet } from 'react-router';
import { useLang } from '../contexts/LanguageContext';
import {
  GitBranch, MessageSquare, GitCommit, Activity, BarChart2,
  Phone, Hash, Settings, ChevronRight, Globe, Bot
} from 'lucide-react';

const navItems = [
  { path: '/', icon: GitBranch, zh: '工作流画布', en: 'Workflow Canvas' },
  { path: '/simulation', icon: MessageSquare, zh: '模拟测试', en: 'Simulation Test' },
  { path: '/versions', icon: GitCommit, zh: '版本管理', en: 'Version Management' },
  { path: '/runtime', icon: Activity, zh: '运行时管理', en: 'Runtime Management' },
  { path: '/dashboard', icon: BarChart2, zh: '运营看板', en: 'Operations Dashboard' },
  { path: '/telephony', icon: Phone, zh: '通信接入', en: 'Telephony Settings' },
  { path: '/numbers', icon: Hash, zh: '号码管理', en: 'Number Management' },
];

export function Layout() {
  const location = useLocation();
  const { lang, toggle, t } = useLang();

  const currentItem = navItems.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif", fontSize: '14px' }}>
      {/* Sidebar */}
      <aside className="flex flex-col w-60 flex-shrink-0" style={{ background: '#1a1a2e', color: '#c8d0e7' }}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-14 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-center w-7 h-7 rounded-md" style={{ background: '#4f46e5' }}>
            <Bot size={16} color="#fff" />
          </div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>VoiceFlow AI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="mb-1 px-3 pb-1" style={{ fontSize: '11px', color: '#5a6688', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('工作流', 'Workflow')}
          </div>
          {navItems.slice(0, 2).map(item => {
            const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 transition-colors"
                style={{
                  background: active ? '#4f46e5' : 'transparent',
                  color: active ? '#fff' : '#8b9cc8',
                  textDecoration: 'none',
                }}
              >
                <item.icon size={16} strokeWidth={2} />
                <span>{t(item.zh, item.en)}</span>
              </Link>
            );
          })}

          <div className="mt-4 mb-1 px-3 pb-1" style={{ fontSize: '11px', color: '#5a6688', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('管理', 'Management')}
          </div>
          {navItems.slice(2).map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 transition-colors"
                style={{
                  background: active ? '#4f46e5' : 'transparent',
                  color: active ? '#fff' : '#8b9cc8',
                  textDecoration: 'none',
                }}
              >
                <item.icon size={16} strokeWidth={2} />
                <span>{t(item.zh, item.en)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-3 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button className="flex items-center gap-2.5 px-3 py-2 rounded-md w-full transition-colors" style={{ color: '#8b9cc8' }}>
            <Settings size={16} strokeWidth={2} />
            <span>{t('设置', 'Settings')}</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 h-14 flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center gap-1.5" style={{ color: '#6b7280', fontSize: '13px' }}>
            <span>AI接待员</span>
            <ChevronRight size={14} />
            <span style={{ color: '#111827' }}>{t(currentItem?.zh ?? '', currentItem?.en ?? '')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 transition-colors hover:bg-gray-50"
              style={{ fontSize: '13px', color: '#374151' }}
            >
              <Globe size={14} />
              <span>{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: '#4f46e5' }}>
                A
              </div>
              <span style={{ fontSize: '13px', color: '#374151' }}>Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden" style={{ background: '#f8f9fa' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
