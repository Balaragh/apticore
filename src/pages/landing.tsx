import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Video, FileText, MessageSquare, BarChart3, BookOpen, Route,
  Brain, CheckCircle2, Zap, Shield, Sparkles, Mic, Clock, ChevronRight, Play,
  Users, Bot, Award, Check
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/contexts/theme-context';
import { Sun, Moon } from 'lucide-react';

const corePillars = [
  {
    icon: BookOpen,
    title: '11 Comprehensive Practice Courses',
    desc: 'Structured curriculum covering Programming Fundamentals, Python, Java, DSA, DBMS & SQL, OS, Networks, OOP, Web Dev, Technical Prep, and Soft Skills.',
    badge: 'Curriculum',
  },
  {
    icon: Video,
    title: 'Dual Live Interview Modes: AI Avatar & Real Human',
    desc: 'Face-to-face practice with an interactive photorealistic AI interviewer featuring synchronized speech and dynamic turn-taking, plus a dedicated WebRTC room mode for real human interviewer evaluation.',
    badge: 'AI + Human',
  },
  {
    icon: MessageSquare,
    title: 'Multilingual AI Mock Interview',
    desc: 'Conduct role-specific technical and HR interviews in English, தமிழ் (Tamil), or हिन्दी (Hindi) with personalized rubric evaluation.',
    badge: '3 Languages',
  },
  {
    icon: FileText,
    title: 'Resume Analyzer & Alignment Prediction',
    desc: 'ATS explainable parsing, skill gap detection, project rewriter with quantified metrics, and before-and-after bullet point enhancement.',
    badge: 'ATS Engine',
  },
  {
    icon: Sparkles,
    title: 'Resume-Based Question Practice',
    desc: 'Defend your specific resume projects, design decisions, tech stack choices, and performance trade-offs against interviewer scrutiny.',
    badge: 'Defense',
  },
  {
    icon: Brain,
    title: 'Timed Aptitude Test System',
    desc: 'Verified question banks across Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation, and Analytical Reasoning.',
    badge: 'Verified Keys',
  },
  {
    icon: Users,
    title: 'AI Group Discussion (Video Call)',
    desc: 'Simulated campus placement GD with AI moderator and peer participants debating Technology, Business, and Society topics.',
    badge: 'Placement GD',
  },
  {
    icon: Bot,
    title: 'Multilingual AI Assistant',
    desc: 'Accessible throughout the platform to clarify technical concepts, refine HR answers, and guide interview strategies in Tamil, Hindi, or English.',
    badge: '24/7 Mentor',
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 font-sans text-navy-900 dark:text-surface-100 selection:bg-accent-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-surface-200 dark:border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" showTagline={true} />

          <div className="flex items-center gap-3">
            <LanguageSelector variant="header" />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-navy-800 text-surface-500 transition-colors focus-ring"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                {t('auth.signInHere')}
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">{t('auth.registerHere')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-200/60 dark:border-accent-800/50 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-xs"
          >
            <Sparkles size={13} className="text-accent-600" />
            <span>Complete Multilingual AI Interview Preparation Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-950 dark:text-white leading-[1.1] tracking-tight max-w-4xl mx-auto"
          >
            Prepare Smarter.
            <br />
            <span className="text-accent-600 dark:text-accent-400">Interview Better.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-surface-600 dark:text-surface-300 max-w-2xl mx-auto leading-relaxed"
          >
            AptiCore upgrades placement readiness for freshers and engineers with interactive course-based AI video interviews, ATS resume analysis, timed aptitude tests, and multi-participant AI group discussions in Tamil, English, and Hindi.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" rightIcon={<ArrowRight size={18} />} className="w-full sm:w-auto shadow-md shadow-accent-600/20">
                Start Preparing Now
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Demo Mode
              </Button>
            </Link>
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-surface-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              11 Practice Courses
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              Webcam & Voice AI Interview
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              Tamil, English & Hindi Support
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" />
              Explainable ATS Prediction
            </span>
          </div>
        </div>
      </section>

      {/* 8 Core Pillars Section */}
      <section className="py-16 bg-surface-50 dark:bg-navy-900 border-y border-surface-200 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-600">
              The 8 Integrated Pillars
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 dark:text-white mt-1">
              Everything You Need to Clear Placement & Technical Interviews
            </h2>
            <p className="text-surface-500 text-sm mt-2">
              From foundational CS knowledge to high-stakes video interviews and group discussions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {corePillars.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-white dark:bg-navy-950 rounded-2xl p-5 border border-surface-200 dark:border-navy-800 shadow-xs hover:border-accent-400 dark:hover:border-accent-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 flex items-center justify-center">
                      <pillar.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-100 dark:bg-navy-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-navy-700">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-navy-950 dark:text-white leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-2 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white dark:bg-navy-950 border-t border-surface-200 dark:border-navy-800 text-xs text-surface-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" showTagline={true} />
          <p>© {new Date().getFullYear()} AptiCore. Prepare Smarter. Interview Better. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
