import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Video, MessageSquare, FileText, Sparkles,
  Brain, Users, BarChart3, History, Settings, LogOut, Menu, X, Bell,
  ChevronDown, Check, ChevronRight, Bot, Languages, Search, HelpCircle
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { AIAssistantModal } from '@/components/assistant/ai-assistant';
import { LanguageSelector } from '@/components/ui/language-selector';
import { DEMO_NOTIFICATIONS } from '@/lib/mock-data';

interface PrimaryNavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: any;
  badge?: string;
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // The 8 primary navigation items in exact order required
  const primaryNavItems: PrimaryNavItem[] = [
    { to: '/dashboard', labelKey: 'nav.overview', defaultLabel: 'Overview', icon: LayoutDashboard },
    { to: '/courses', labelKey: 'nav.courses', defaultLabel: 'Practice Courses', icon: BookOpen },
    { to: '/interview/course-video', labelKey: 'nav.courseVideo', defaultLabel: 'Course-Based Video Interview', icon: Video, badge: 'AI Video' },
    { to: '/interview/mock', labelKey: 'nav.mockInterview', defaultLabel: 'AI Mock Interview', icon: MessageSquare },
    { to: '/resume', labelKey: 'nav.resumeAnalyzer', defaultLabel: 'Resume Analyzer & Prediction', icon: FileText },
    { to: '/resume/practice', labelKey: 'nav.resumeQuestions', defaultLabel: 'Resume-Based Question Practice', icon: Sparkles },
    { to: '/aptitude', labelKey: 'nav.aptitude', defaultLabel: 'Aptitude Test', icon: Brain },
    { to: '/group-discussion', labelKey: 'nav.groupDiscussion', defaultLabel: 'AI Group Discussion', icon: Users, badge: 'GD Call' },
  ];

  // Dedicated Live Interview Modes
  const interviewModeNavItems: PrimaryNavItem[] = [
    { to: '/interview/modes', labelKey: 'nav.interviewModes', defaultLabel: 'Interview Modes Hub', icon: Video, badge: 'Modes' },
    { to: '/interview/ai-video', labelKey: 'nav.aiVideoInterview', defaultLabel: 'AI Video Interview', icon: Bot, badge: 'Photoreal' },
    { to: '/interview/schedule', labelKey: 'nav.livePeerInterview', defaultLabel: 'Real Human Interview', icon: Users, badge: 'WebRTC' },
  ];

  // Secondary items
  const secondaryNavItems = [
    { to: '/roadmap', labelKey: 'nav.roadmap', defaultLabel: 'Learning Roadmap', icon: BookOpen },
    { to: '/analytics', labelKey: 'nav.analytics', defaultLabel: 'Performance Analytics', icon: BarChart3 },
    { to: '/history', labelKey: 'nav.history', defaultLabel: 'Interview History', icon: History },
    { to: '/settings', labelKey: 'nav.settings', defaultLabel: 'Settings', icon: Settings },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const currentNav =
    interviewModeNavItems.find((item) => location.pathname.startsWith(item.to)) ||
    primaryNavItems.find((item) =>
      item.to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.to)
    ) || secondaryNavItems.find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-[#172033]">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-[#E2E8F0] fixed inset-y-0 left-0 z-30 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] bg-white">
          <Logo size="md" showTagline={false} />
        </div>

        {/* 8 Primary Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Primary Preparation
          </div>
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-accent-50 text-accent-700 font-semibold shadow-xs border-l-2 border-accent-600'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033] font-medium'
                }`
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <item.icon size={17} className="shrink-0 text-accent-600" />
                <span className="truncate">{t(item.labelKey)}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent-600 text-white shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Live Interview Modes Divider */}
          <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Live Interview Modes
          </div>
          {interviewModeNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-accent-50 text-accent-700 font-semibold shadow-xs border-l-2 border-accent-600'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033] font-medium'
                }`
              }
            >
              <div className="flex items-center gap-2.5 truncate">
                <item.icon size={17} className="shrink-0 text-accent-600" />
                <span className="truncate">{t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent-600 text-white shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Secondary Items Divider */}
          <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Analytics & Account
          </div>
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive
                    ? 'bg-accent-50 text-accent-700 font-semibold border-l-2 border-accent-600'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033] font-medium'
                }`
              }
            >
              <item.icon size={16} className="shrink-0 text-[#64748B]" />
              <span>{t(item.labelKey) || item.defaultLabel}</span>
            </NavLink>
          ))}
        </div>

        {/* Quick Launch & AI Assistant CTA */}
        <div className="p-3.5 border-t border-[#E2E8F0] space-y-2 bg-[#F8FAFC]">
          <button
            onClick={() => setAssistantOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-accent-50 text-accent-700 border border-[#E2E8F0] hover:border-accent-200 rounded-lg font-semibold text-xs transition-all shadow-xs"
          >
            <Bot size={15} className="text-accent-600" />
            <span>AI Assistant (3 Languages)</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white border-r border-[#E2E8F0] z-50 lg:hidden flex flex-col shadow-xl"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-[#E2E8F0]">
                <Logo size="md" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:bg-[#F8FAFC]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-4 px-3 space-y-1 flex-1 overflow-y-auto">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Primary Preparation
                </div>
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-accent-50 text-accent-700 font-bold border-l-2 border-accent-600'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon size={17} className="text-accent-600" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}

                <div className="pt-3 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Live Interview Modes
                </div>
                {interviewModeNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-accent-50 text-accent-700 font-bold border-l-2 border-accent-600'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon size={17} className="text-accent-600" />
                      <span className="truncate">{t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-accent-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}

                <div className="pt-3 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Analytics & Account
                </div>
                {secondaryNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-50 text-accent-700 font-bold border-l-2 border-accent-600'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033]'
                      }`
                    }
                  >
                    <item.icon size={16} className="text-[#64748B]" />
                    <span>{t(item.labelKey) || item.defaultLabel}</span>
                  </NavLink>
                ))}
              </div>

              <div className="p-4 border-t border-[#E2E8F0]">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    setAssistantOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-600 text-white rounded-lg font-semibold text-xs shadow-xs"
                >
                  <Bot size={15} />
                  <span>Open AI Assistant</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main View Container ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#64748B] min-w-0">
              <span className="hidden sm:inline font-semibold text-[#172033]">AptiCore</span>
              <ChevronRight size={14} className="hidden sm:inline text-surface-400 shrink-0" />
              <span className="font-semibold text-accent-700 truncate">
                {currentNav ? t(currentNav.labelKey) || currentNav.defaultLabel : 'Workspace'}
              </span>
            </div>
          </div>

          {/* Right Header Bar Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Global Reusable Language Selector */}
            <LanguageSelector variant="header" />

            {/* AI Assistant Quick Trigger */}
            <button
              onClick={() => setAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-50 text-accent-700 border border-accent-200 font-semibold text-xs hover:bg-accent-100 transition-colors"
              title={t('header.aiAssistant')}
            >
              <Bot size={15} />
              <span className="hidden md:inline">{t('header.aiAssistant')}</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                  setLangMenuOpen(false);
                }}
                className="p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] transition-colors relative border border-[#E2E8F0] bg-white"
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-600 rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden z-50"
                  >
                    <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                      <h4 className="font-bold text-xs text-[#172033]">
                        {t('header.notifications')}
                      </h4>
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-accent-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#E2E8F0]">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-3 text-xs space-y-0.5 bg-white">
                          <p className="font-semibold text-[#172033]">{n.title}</p>
                          <p className="text-[#64748B] text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                  setLangMenuOpen(false);
                }}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[#F8FAFC] transition-colors border border-[#E2E8F0] bg-white"
              >
                <div className="w-7 h-7 rounded-full bg-accent-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:block text-xs font-semibold text-[#172033]">
                  {user?.name || 'Candidate'}
                </span>
                <ChevronDown size={13} className="text-[#64748B]" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden z-50 p-1.5 space-y-0.5"
                  >
                    <div className="p-2.5 border-b border-[#E2E8F0] mb-1">
                      <p className="text-xs font-bold text-[#172033]">
                        {user?.name || 'Candidate'}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-md font-medium"
                    >
                      <Settings size={14} /> {t('nav.settings')}
                    </button>
                    <button
                      onClick={() => {
                        navigate('/history');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-md font-medium"
                    >
                      <History size={14} /> {t('nav.history')}
                    </button>
                    <div className="h-px bg-[#E2E8F0] my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-error-600 hover:bg-red-50 rounded-md font-semibold"
                    >
                      <LogOut size={14} /> {t('nav.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Multilingual AI Assistant Modal / Drawer */}
      <AIAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}
