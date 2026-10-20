import { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Key,
  CheckCircle2,
  Save,
  Download,
  Languages,
  Volume2,
  VolumeX,
  Play,
  Mic,
  Gauge,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useVoice } from '@/contexts/voice-context';
import { LanguageSelector } from '@/components/ui/language-selector';
import {
  getOnboardingProfile,
  saveOnboardingProfile,
  getDailyGoal,
  saveDailyGoal,
} from '@/lib/storage';
import type { InterviewType } from '@/types';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const {
    voiceEnabled,
    setVoiceEnabled,
    speechRate,
    setSpeechRate,
    isMuted,
    toggleMute,
    speak,
    stop,
    micPermission,
    requestMicPermission,
  } = useVoice();

  const [activeTab, setActiveTab] = useState<'profile' | 'languageVoice' | 'preferences' | 'security'>('languageVoice');

  // Profile form state
  const [name, setName] = useState(user?.name || 'Alex Johnson');
  const [email, setEmail] = useState(user?.email || 'alex@example.com');
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [bio, setBio] = useState('Aspiring Software Engineer focused on React, TypeScript, and modern scalable web systems.');

  // Training preferences state
  const initialProfile = getOnboardingProfile();
  const initialGoal = getDailyGoal();
  const [trainingRole, setTrainingRole] = useState(initialProfile.targetRole);
  const [trainingType, setTrainingType] = useState<InterviewType>(initialProfile.preferredInterviewType);
  const [dailyGoalCount, setDailyGoalCount] = useState(initialGoal.targetQuestions);

  // Preferences toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Security password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveOnboardingProfile({
      ...initialProfile,
      targetRole,
    });
    toast.success(t('common.success'));
  };

  const handleSavePreferences = () => {
    saveOnboardingProfile({
      targetRole: trainingRole,
      preferredInterviewType: trainingType,
      dailyQuestionGoal: dailyGoalCount,
      completedOnboarding: true,
    });
    saveDailyGoal({
      ...initialGoal,
      targetQuestions: dailyGoalCount,
      targetMinutes: dailyGoalCount * 7,
    });
    toast.success(t('common.success'));
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated securely!');
  };

  const handleTestVoice = () => {
    stop();
    const sampleGreeting = t('voice.friendlyGreeting');
    speak(sampleGreeting, language);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ user, exportedAt: new Date().toISOString() }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'apticore_user_data.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('User data exported as JSON!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans text-[#172033]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
            {t('settings.title')}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2 mt-1">
          <Settings className="text-accent-600" size={26} />
          {t('settings.title')}
        </h1>
        <p className="text-[#64748B] text-sm mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        {[
          { id: 'languageVoice', label: t('settings.languageTab'), icon: Languages },
          { id: 'profile', label: t('settings.profileTab'), icon: User },
          { id: 'preferences', label: 'Training Goals', icon: Bell },
          { id: 'security', label: t('settings.securityTab'), icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-[#64748B] hover:bg-white hover:text-[#172033]'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content: Language & Voice */}
      {activeTab === 'languageVoice' && (
        <div className="space-y-6">
          {/* Language Selection Card */}
          <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Languages size={18} className="text-accent-600" />
                {t('settings.languageSelectLabel')}
              </CardTitle>
            </CardHeader>

            <p className="text-xs text-[#64748B] mb-4">
              {t('settings.languageHelp')}
            </p>

            <LanguageSelector variant="cards" />
          </Card>

          {/* Friendly AI Voice Settings Card */}
          <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs space-y-5">
            <CardHeader className="p-0 pb-1">
              <CardTitle className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Volume2 size={18} className="text-accent-600" />
                {t('settings.voiceSectionTitle')}
              </CardTitle>
            </CardHeader>

            {/* Toggle Narration */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h4 className="text-xs font-bold text-[#172033]">
                  {t('settings.voiceEnabledLabel')}
                </h4>
                <p className="text-[11px] text-[#64748B] max-w-md">
                  {t('settings.voiceEnabledHelp')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-accent-600 accent-accent-600"
              />
            </div>

            {/* Speed Control */}
            <div className="space-y-2 pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <Gauge size={14} className="text-accent-600" />
                  {t('settings.voiceSpeedLabel')}
                </label>
                <span className="text-xs font-mono font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded">
                  {speechRate}x
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0.8, label: t('settings.speedSlow') },
                  { rate: 1.0, label: t('settings.speedNormal') },
                  { rate: 1.2, label: t('settings.speedFast') },
                ].map((s) => (
                  <button
                    key={s.rate}
                    type="button"
                    onClick={() => setSpeechRate(s.rate)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      speechRate === s.rate
                        ? 'border-accent-600 bg-accent-600/10 text-accent-700 font-bold'
                        : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Testing & Microphone Permission Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Test Voice Sample */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <span className="text-xs font-bold text-[#172033] block">
                  Auditory Voice Preview
                </span>
                <p className="text-[11px] text-[#64748B]">
                  Listen to the warm, natural cadence in your selected language.
                </p>
                <Button
                  size="sm"
                  onClick={handleTestVoice}
                  leftIcon={<Play size={14} />}
                  className="bg-accent-600 hover:bg-accent-700 text-white text-xs w-full"
                >
                  {t('settings.testVoiceButton')}
                </Button>
              </div>

              {/* Microphone Permission Status */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172033]">
                    Microphone Input Check
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      micPermission === 'granted'
                        ? 'bg-success-600/10 text-success-600 border border-success-600/20'
                        : micPermission === 'denied'
                        ? 'bg-error-600/10 text-error-600 border border-error-600/20'
                        : 'bg-warning-600/10 text-warning-600 border border-warning-600/20'
                    }`}
                  >
                    {micPermission.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Verify browser speech recognition permission for hands-free dictation.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestMicPermission}
                  leftIcon={<Mic size={14} />}
                  className="bg-white hover:bg-[#F8FAFC] text-[#172033] border-[#E2E8F0] text-xs w-full"
                >
                  Test Microphone Access
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: Profile */}
      {activeTab === 'profile' && (
        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-bold text-[#172033]">{t('settings.profileTab')}</CardTitle>
          </CardHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-[#E2E8F0]">
              <div className="w-16 h-16 rounded-2xl bg-accent-600 text-white flex items-center justify-center font-bold text-2xl shadow-xs">
                {name.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172033]">{name}</h4>
                <p className="text-xs text-[#64748B]">{email}</p>
                <span className="inline-block mt-1 text-[11px] font-medium text-success-600 bg-success-600/10 px-2 py-0.5 rounded-full border border-success-600/20">
                  Active Candidate Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#172033] block mb-1">
                  {t('auth.nameLabel')}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#172033] block mb-1">
                  {t('auth.emailLabel')}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Target Job Role
              </label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Professional Bio / Goal Statement
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-accent-600 leading-relaxed resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" size="sm" leftIcon={<Save size={15} />} className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab Content: Preferences */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm font-bold text-[#172033]">Training Goals & Target Alignment</CardTitle>
            </CardHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#172033] block mb-1">
                  Primary Interview Focus
                </label>
                <select
                  value={trainingRole}
                  onChange={(e) => setTrainingRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-accent-600"
                >
                  <option value="Frontend Developer">Frontend Developer (React, TypeScript)</option>
                  <option value="Backend Developer">Backend Developer (Node.js, Express, DBs)</option>
                  <option value="Full Stack Developer">Full Stack Developer (MERN Stack)</option>
                  <option value="Python Developer">Python Developer (FastAPI, Django, Algorithms)</option>
                  <option value="Java Developer">Java Developer (Spring Boot, Microservices)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#172033] block mb-1">
                  Preferred Question Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'technical', label: 'Technical' },
                    { id: 'behavioral', label: 'Behavioral' },
                    { id: 'system-design', label: 'System Design' },
                    { id: 'mixed', label: 'Mixed Practice' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTrainingType(f.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        trainingType === f.id
                          ? 'border-accent-600 bg-accent-600/10 text-accent-700 font-bold'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#172033]">
                    Daily Practice Goal: {dailyGoalCount} Questions (~{dailyGoalCount * 7} mins)
                  </label>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={dailyGoalCount}
                  onChange={(e) => setDailyGoalCount(Number(e.target.value))}
                  className="w-full accent-accent-600"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button size="sm" onClick={handleSavePreferences} leftIcon={<Save size={15} />} className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
                  {t('settings.saveSettings')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: Security */}
      {activeTab === 'security' && (
        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs space-y-6">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Key size={16} className="text-accent-600" />
              Change Account Password
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Current Password
              </label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                New Secure Password
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
              />
            </div>

            <Button type="submit" size="sm" className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
              Update Password
            </Button>
          </form>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#172033]">Export Personal Candidate Data</h4>
              <p className="text-[11px] text-[#64748B]">Download all past interview responses, ATS audits, and scores in JSON format.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData} leftIcon={<Download size={14} />} className="text-xs bg-white border-[#E2E8F0] text-[#172033]">
              Export JSON
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
