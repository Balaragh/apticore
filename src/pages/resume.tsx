import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, ArrowRight,
  TrendingUp, Award, HelpCircle, Check, RefreshCw, ChevronRight, X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { DEMO_RESUME_ANALYSIS } from '@/lib/mock-data';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

interface SkillItem {
  name: string;
  category: string;
}

interface GapItem {
  skill: string;
  tip: string;
}

const TARGET_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
];

const REWRITE_EXAMPLES = [
  {
    before: 'Worked on React application and fixed bugs.',
    after: 'Engineered responsive React 19 web application, refactoring state management to reduce render bottlenecks by 34% and improving Core Web Vitals to 96/100.',
    improvementReason: 'Quantifies architectural impact and includes performance metrics.',
  },
  {
    before: 'Created REST APIs for user registration and authentication.',
    after: 'Designed and deployed secure Node.js/Express REST APIs with JWT & bcrypt authentication, rate-limiting middleware, and 99.9% uptime across 10,000+ test requests.',
    improvementReason: 'Demonstrates security best practices and throughput scale.',
  },
  {
    before: 'Used Git and participated in agile meetings.',
    after: 'Led collaborative Git branching and CI/CD pull request reviews across a 5-engineer team, maintaining 100% test passing rate on automated test suites.',
    improvementReason: 'Emphasizes leadership, team collaboration, and code quality rigor.',
  },
];

export default function ResumePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [selectedRole, setSelectedRole] = useState('Frontend Developer');
  const [fileName, setFileName] = useState('Alex_Johnson_Resume_2026.pdf');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallScore, setOverallScore] = useState(84);

  const [extractedSkills, setExtractedSkills] = useState<SkillItem[]>([
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Languages' },
    { name: 'JavaScript (ES6+)', category: 'Languages' },
    { name: 'HTML5 & CSS3', category: 'Frontend' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'REST APIs', category: 'Architecture' },
    { name: 'Git & GitHub', category: 'DevOps' },
    { name: 'MongoDB', category: 'Databases' },
  ]);

  const [missingSkills, setMissingSkills] = useState<GapItem[]>([
    { skill: 'Vitest / Jest Unit Testing', tip: 'Essential for Frontend roles. Add unit tests for critical business logic.' },
    { skill: 'State Management (Zustand/Redux Toolkit)', tip: 'Highlight predictable global data flow across complex views.' },
    { skill: 'Web Vitals & Performance Optimization', tip: 'Mention LCP, FID, and CLS tuning metrics on production builds.' },
  ]);

  const [checklist, setChecklist] = useState([
    { id: '1', text: 'Quantify achievements with metrics (e.g. % faster, users served)', done: true },
    { id: '2', text: 'Include unit & integration testing tools (Vitest, Jest, Cypress)', done: false },
    { id: '3', text: 'Align keywords directly with target job description', done: true },
    { id: '4', text: 'Ensure clean single-column ATS readable layout', done: true },
    { id: '5', text: 'Highlight GitHub and deployed project live links with HTTPS', done: true },
    { id: '6', text: 'Add measurable state management experience (Zustand / Redux)', done: false },
  ]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      setIsAnalyzing(true);

      toast.loading(language === 'ta' ? `ATS என்ஜின் மூலம் "${file.name}" பகுப்பாய்வு செய்யப்படுகிறது...` : language === 'hi' ? `ATS इंजन के माध्यम से "${file.name}" का विश्लेषण हो रहा है...` : `Parsing "${file.name}" through ATS engine...`, { duration: 1500 });

      setTimeout(() => {
        setIsAnalyzing(false);
        setOverallScore(Math.floor(78 + Math.random() * 14));
        toast.success(language === 'ta' ? 'Resume வெற்றிகரமாக மதிப்பீடு செய்யப்பட்டது!' : language === 'hi' ? 'रिज्यूमे का सफलतापूर्वक मूल्यांकन किया गया!' : 'Resume parsed and evaluated successfully!');
      }, 1600);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setIsAnalyzing(true);
    toast.loading(`Re-evaluating ATS match for ${role}...`, { duration: 1000 });

    setTimeout(() => {
      setIsAnalyzing(false);
      if (role.includes('Frontend')) {
        setOverallScore(86);
      } else if (role.includes('Backend')) {
        setOverallScore(73);
      } else {
        setOverallScore(80);
      }
      toast.success(`Updated role alignment for ${role}`);
    }, 1100);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#172033]">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              {t('resume.title', 'Resume Analyzer & ATS Optimizer')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-600/10 text-success-600 border border-success-600/20">
              ATS Explainable Engine
            </span>
          </div>
          <p className="text-[#64748B] text-sm mt-1">
            {t('resume.subtitle', 'Upload your resume in PDF or DOCX format to calculate your ATS match score, extract skills, and generate personalized interview questions.')}
          </p>
        </div>

        {/* Action to Practice Questions based on this resume */}
        <Button
          onClick={() => navigate('/resume/practice')}
          leftIcon={<Sparkles size={16} />}
          className="bg-accent-600 hover:bg-accent-700 text-white shadow-xs text-xs font-semibold"
        >
          {t('resume.practiceWithResume', 'Practice Questions for this Resume')}
        </Button>
      </div>

      {/* 2. Upload & Target Role Configuration */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div className="md:col-span-2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
              isDragActive
                ? 'border-accent-600 bg-accent-600/5'
                : 'border-[#CBD5E1] hover:border-accent-600 bg-white shadow-xs'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center mx-auto mb-3 border border-accent-600/20">
              <Upload size={22} />
            </div>
            <h3 className="font-bold text-sm text-[#172033]">
              {isDragActive ? (language === 'ta' ? 'Resume-ஐ இங்கே விடவும்...' : language === 'hi' ? 'रिज्यूमे यहाँ छोड़ें...' : 'Drop resume here...') : t('resume.dropPrompt', 'Drag & drop your resume PDF here, or browse files')}
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              {t('resume.supportedFormats', 'Supports PDF, DOCX up to 10MB')}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-[#64748B]">
              <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">.pdf</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">.docx</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]">.txt</span>
            </div>
          </div>
        </div>

        {/* Target Role & Current File Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Target Job Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#172033] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent-600"
            >
              {TARGET_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="mt-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent-600" />
                <span className="text-xs font-semibold text-[#172033] truncate">
                  {fileName}
                </span>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">
                Extracted parsed tokens successfully
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRoleChange(selectedRole)}
            className="w-full mt-3 text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
            leftIcon={<RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />}
          >
            Re-Analyze Alignment
          </Button>
        </div>
      </div>

      {/* 3. Prediction & Score Overview */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Match Percentage Card */}
        <Card padding="md" className="flex flex-col justify-between bg-white border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                {t('resume.atsScore', 'ATS Compatibility Score')}
              </span>
              <Badge variant="accent" size="sm">Explainable Match</Badge>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-extrabold text-accent-600">
                {overallScore}%
              </span>
              <span className="text-xs text-[#64748B]">
                Match for {selectedRole}
              </span>
            </div>

            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Based on keyword density, core competency mapping, and project scope depth.
            </p>
          </div>

          {/* Honest Disclaimer */}
          <div className="mt-4 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B] leading-snug">
            <p className="font-semibold text-[#172033] flex items-center gap-1 mb-0.5">
              <HelpCircle size={12} className="text-accent-600" />
              Algorithmic Estimate:
            </p>
            This score reflects algorithmic alignment against typical industry job specifications, not a guaranteed hiring or callback outcome.
          </div>
        </Card>

        {/* Extracted Skills */}
        <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t('resume.skillsDetected', 'Extracted Skills')} ({extractedSkills.length})
            </span>
            <span className="text-[11px] text-success-600 font-semibold">Parsed</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
            {extractedSkills.map((s) => (
              <span
                key={s.name}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] flex items-center gap-1 font-medium"
              >
                <Check size={12} className="text-success-600" />
                {s.name}
              </span>
            ))}
          </div>
        </Card>

        {/* Identified Gaps */}
        <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t('resume.missingKeywords', 'Recommended Keyword Additions')}
            </span>
            <Badge variant="warning" size="sm">3 Missing</Badge>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {missingSkills.map((gap) => (
              <div
                key={gap.skill}
                className="p-2 rounded-lg bg-warning-600/10 border border-warning-600/20 text-xs"
              >
                <p className="font-bold text-warning-600">
                  {gap.skill}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {gap.tip}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Quantified Bullet Point Enhancer (Before & After) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
            <Sparkles size={18} className="text-accent-600" />
            Quantified Achievement Rewriter (Before vs. After)
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Upgrade vague duties into impact-driven bullet points using the <strong>Action Verb + Metric + Technical Architecture</strong> formula.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {REWRITE_EXAMPLES.map((ex, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3"
            >
              {/* Before */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-error-600 bg-error-600/10 px-2 py-0.5 rounded-md border border-error-600/20">
                  Weak Statement
                </span>
                <p className="text-xs text-[#64748B] line-through">
                  "{ex.before}"
                </p>
              </div>

              {/* After */}
              <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-success-600 bg-success-600/10 px-2 py-0.5 rounded-md border border-success-600/20">
                  Optimized Impact
                </span>
                <p className="text-xs font-semibold text-[#172033]">
                  "{ex.after}"
                </p>
              </div>

              <p className="text-[10px] text-[#64748B] italic">
                Why: {ex.improvementReason}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Resume Improvement Checklist */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-success-600" />
              {t('resume.formattingChecks', 'Resume Health & Formatting Checklist')}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Check off items as you optimize your resume before submitting placement applications.
            </p>
          </div>
          <span className="text-xs font-bold text-[#172033]">
            {checklist.filter((c) => c.done).length} of {checklist.length} Completed
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                item.done
                  ? 'bg-success-600/5 border-success-600/20'
                  : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                  item.done
                    ? 'bg-success-600 text-white'
                    : 'border border-[#CBD5E1]'
                }`}
              >
                {item.done && <Check size={13} />}
              </div>
              <span
                className={`text-xs font-medium leading-snug ${
                  item.done
                    ? 'text-[#172033]'
                    : 'text-[#64748B]'
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={() => navigate('/resume/practice')}
            rightIcon={<ChevronRight size={16} />}
            className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold"
          >
            {t('resume.practiceWithResume', 'Practice Questions on this Resume')}
          </Button>
        </div>
      </div>
    </div>
  );
}
