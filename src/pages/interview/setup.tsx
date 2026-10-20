import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Play, Video, MessageSquare, BookOpen, Layers, Check, Plus,
  ChevronRight, UserCheck, HelpCircle, ArrowLeft, Clock, ShieldCheck, FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEMO_RESUME_ANALYSIS, INTERVIEWER_PERSONAS } from '@/lib/mock-data';
import { useLanguage } from '@/contexts/language-context';
import type { InterviewConfig, InterviewType, Difficulty, PracticeMode } from '@/types';
import toast from 'react-hot-toast';

const primaryRoles = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
  'Custom Role',
];

const availableTechs = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Next.js', 'Express',
  'Python', 'FastAPI', 'Java', 'Spring Boot', 'System Design', 'PostgreSQL',
  'MongoDB', 'Docker', 'REST APIs', 'GraphQL', 'Git', 'CSS/Tailwind',
  'Unit Testing', 'STAR Method', 'Redis Caching'
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [practiceMode, setPracticeMode] = useState<PracticeMode>('video');
  const [selectedRole, setSelectedRole] = useState('Frontend Developer');
  const [customRole, setCustomRole] = useState('');
  const [selectedType, setSelectedType] = useState<InterviewType>('mixed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [selectedTechs, setSelectedTechs] = useState<string[]>(['React', 'TypeScript', 'JavaScript']);
  const [customTech, setCustomTech] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [selectedPersona, setSelectedPersona] = useState('sarah');

  // Check if saved config exists
  useEffect(() => {
    const saved = sessionStorage.getItem('apticore_active_config');
    if (saved) {
      try {
        const c: InterviewConfig = JSON.parse(saved);
        if (c.role) setSelectedRole(c.role);
        if (c.type) setSelectedType(c.type);
        if (c.difficulty) setSelectedDifficulty(c.difficulty);
        if (c.questionCount) setQuestionCount(c.questionCount);
        if (c.technologies && c.technologies.length) setSelectedTechs(c.technologies);
      } catch {}
    }
  }, []);

  const toggleTech = (tech: string) => {
    if (selectedTechs.includes(tech)) {
      if (selectedTechs.length === 1) {
        toast.error(language === 'ta' ? 'குறைந்தது ஒரு திறனைத் தேர்ந்தெடுக்கவும்' : language === 'hi' ? 'कृपया कम से कम एक कौशल चुनें' : 'Please select at least one skill or topic');
        return;
      }
      setSelectedTechs(selectedTechs.filter((t) => t !== tech));
    } else {
      setSelectedTechs([...selectedTechs, tech]);
    }
  };

  const handleAddCustomTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTech.trim()) return;
    if (!selectedTechs.includes(customTech.trim())) {
      setSelectedTechs([...selectedTechs, customTech.trim()]);
    }
    setCustomTech('');
  };

  const handleLoadFromResume = () => {
    setSelectedRole(DEMO_RESUME_ANALYSIS.targetRole);
    setSelectedTechs(['React', 'TypeScript', 'Testing', 'State Management', 'Web Vitals']);
    setSelectedDifficulty('medium');
    toast.success(
      language === 'ta'
        ? `Resume-லிருந்து "${DEMO_RESUME_ANALYSIS.targetRole}" ரோல் ஏற்றப்பட்டது!`
        : language === 'hi'
        ? `रिज्यूमे से "${DEMO_RESUME_ANALYSIS.targetRole}" रोल लोड किया गया!`
        : `Loaded target role "${DEMO_RESUME_ANALYSIS.targetRole}" and topics from Resume Analysis!`
    );
  };

  const handleStartInterview = (chosenMode?: PracticeMode) => {
    const modeToUse = chosenMode || practiceMode;
    const roleToUse = selectedRole === 'Custom Role' && customRole.trim() ? customRole.trim() : selectedRole;

    const sessionConfig: InterviewConfig = {
      role: roleToUse,
      technologies: selectedTechs,
      difficulty: selectedDifficulty,
      type: selectedType,
      questionCount,
      timePerQuestion: Math.round((durationMinutes * 60) / questionCount),
      mode: modeToUse,
      durationMinutes,
      interviewerId: selectedPersona,
    };

    sessionStorage.setItem('apticore_active_config', JSON.stringify(sessionConfig));
    sessionStorage.setItem('apticore_interviewer_persona', selectedPersona);

    if (modeToUse === 'video') {
      navigate('/interview/course-video');
    } else if (modeToUse === 'question') {
      navigate('/questions');
    } else {
      navigate('/interview/mock');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans text-[#172033]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
              {language === 'ta' ? 'அமர்வு அமைப்புகள்' : language === 'hi' ? 'सत्र कॉन्फ़िगरेशन' : 'Session Configuration'}
            </span>
            <span className="text-xs text-[#64748B]">Step 1 of 2</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-1">
            {t('interviewSetup.title', 'Configure Interview Practice')}
          </h1>
          <p className="text-[#64748B] text-sm mt-0.5">
            {t('interviewSetup.subtitle', 'Tailor questions to your target position, difficulty level, and practice preference.')}
          </p>
        </div>

        {/* Load Resume Analysis Bridge Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadFromResume}
          leftIcon={<FileText size={15} className="text-accent-600" />}
          className="self-start sm:self-auto text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
        >
          {language === 'ta' ? 'Resume-லிருந்து ஏற்று' : language === 'hi' ? 'रिज्यूमे से लोड करें' : 'Load from Resume Analysis'}
        </Button>
      </div>

      {/* 1. Practice Mode Selection */}
      <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs">
        <CardTitle className="text-sm font-bold text-[#172033] flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-accent-600" />
          {language === 'ta' ? 'பயிற்சி முறையைத் தேர்ந்தெடுக்கவும்' : language === 'hi' ? 'अभ्यास मोड चुनें' : 'Select Practice Mode'}
        </CardTitle>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              id: 'video',
              title: language === 'ta' ? 'வீடியோ நேர்காணல் பயிற்சி' : language === 'hi' ? 'वीडियो इंटरव्यू अभ्यास' : 'Video Interview Practice',
              desc: language === 'ta' ? 'Webcam மற்றும் நேரடி குரல் கேள்விகளுடன் கூடிய உருவகப்படுத்துதல்.' : language === 'hi' ? 'वेबकैम और लाइव वॉयस प्रश्नों के साथ सिमुलेशन।' : 'Live video simulation with webcam preview, spoken questions, and speech transcription.',
              icon: Video,
              badge: 'Recommended',
            },
            {
              id: 'mock',
              title: language === 'ta' ? 'பன்மொழி மாக் அமர்வு' : language === 'hi' ? 'बहुभाषी मॉक सत्र' : 'Multilingual Mock Session',
              desc: language === 'ta' ? 'தமிழ், இந்தி அல்லது ஆங்கிலத்தில் மாதிரி பதில்களுடன் கூடிய அமர்வு.' : language === 'hi' ? 'तमिल, हिंदी या अंग्रेजी में मॉडल उत्तरों के साथ सत्र।' : 'Classic multilingual interview in Tamil, Hindi, or English with model answers.',
              icon: MessageSquare,
              badge: 'Multilingual',
            },
            {
              id: 'question',
              title: language === 'ta' ? 'கேள்வி வங்கி பயிற்சி' : language === 'hi' ? 'प्रश्न बैंक प्रशिक्षण' : 'Question Bank Training',
              desc: language === 'ta' ? 'STAR வழிகாட்டியுடன் உங்கள் வேகத்தில் பயிற்சி பெறுங்கள்.' : language === 'hi' ? 'STAR गाइड के साथ अपनी गति से अभ्यास करें।' : 'Practice isolated problems at your own pace with the STAR answer coach.',
              icon: BookOpen,
              badge: 'Targeted',
            },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPracticeMode(mode.id as PracticeMode)}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                practiceMode === mode.id
                  ? 'border-accent-600 bg-accent-600/5 ring-2 ring-accent-600 shadow-xs'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    practiceMode === mode.id ? 'bg-accent-600 text-white' : 'bg-[#F8FAFC] text-[#64748B]'
                  }`}>
                    <mode.icon size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-accent-600 uppercase tracking-wide">
                    {mode.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#172033]">
                  {mode.title}
                </h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {mode.desc}
                </p>
              </div>

              {practiceMode === mode.id && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-accent-600">
                  <Check size={14} /> {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்டது' : language === 'hi' ? 'चयनित' : 'Selected Mode'}
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* 2. Target Job Role & Format */}
      <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs space-y-4">
        <CardTitle className="text-sm font-bold text-[#172033]">{t('interviewSetup.roleLabel', 'Target Job Role & Format')}</CardTitle>

        <div>
          <label className="text-xs font-semibold text-[#172033] block mb-2">
            {t('interviewSetup.roleLabel', 'Target Position')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {primaryRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  selectedRole === role
                    ? 'border-accent-600 bg-accent-600/5 text-accent-600 ring-1 ring-accent-600'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {selectedRole === 'Custom Role' && (
            <div className="mt-2.5">
              <Input
                placeholder="Enter custom role title (e.g. AI Prompt Engineer, Site Reliability Engineer)"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
              />
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
          <div>
            <label className="text-xs font-semibold text-[#172033] block mb-2">
              {t('interviewSetup.roundLabel', 'Interview Format')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'technical', label: t('interviewSetup.technical', 'Technical') },
                { id: 'behavioral', label: t('interviewSetup.behavioral', 'Behavioral (STAR)') },
                { id: 'system-design', label: t('interviewSetup.systemDesign', 'System Design') },
                { id: 'mixed', label: t('interviewSetup.mixed', 'Mixed Round') },
              ].map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setSelectedType(tItem.id as InterviewType)}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedType === tItem.id
                      ? 'border-accent-600 bg-accent-600/5 text-accent-600 font-semibold'
                      : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#172033] block mb-2">
              {language === 'ta' ? 'கடினத்தன்மை நிலை' : language === 'hi' ? 'कठिनाई स्तर' : 'Target Difficulty'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'easy', label: language === 'ta' ? 'ஆரம்ப நிலை' : language === 'hi' ? 'प्रारंभिक' : 'Junior / Entry', desc: 'Fundamentals' },
                { id: 'medium', label: language === 'ta' ? 'நடுத்தர நிலை' : language === 'hi' ? 'मध्यम' : 'Mid-Level', desc: 'Practical scenarios' },
                { id: 'hard', label: language === 'ta' ? 'முதுநிலை' : language === 'hi' ? 'वरिष्ठ' : 'Senior / Lead', desc: 'Architecture depth' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(d.id as Difficulty)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedDifficulty === d.id
                      ? 'border-accent-600 bg-accent-600/5 text-accent-600 ring-1 ring-accent-600'
                      : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="text-xs font-bold block">{d.label}</span>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Skill & Technology Tags */}
      <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-[#172033]">
            {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட திறன்கள்' : language === 'hi' ? 'चयनित कौशल' : 'Focus Technologies & Skills'} ({selectedTechs.length})
          </CardTitle>
          <span className="text-xs text-[#64748B]">{language === 'ta' ? 'மாற்ற தட்டவும்' : language === 'hi' ? 'टॉगल करने के लिए टैप करें' : 'Click tags to toggle'}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {availableTechs.map((tech) => {
            const isSelected = selectedTechs.includes(tech);
            return (
              <button
                key={tech}
                type="button"
                onClick={() => toggleTech(tech)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-accent-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#172033]'
                }`}
              >
                <span>{tech}</span>
                {isSelected && <Check size={12} />}
              </button>
            );
          })}
        </div>

        {/* Custom Tech Add */}
        <form onSubmit={handleAddCustomTech} className="flex gap-2 pt-2">
          <Input
            placeholder={language === 'ta' ? 'புதிய தொழில்நுட்பத்தைச் சேர்க்கவும் (எ.கா. Next.js, Redux)' : language === 'hi' ? 'कस्टम तकनीक जोड़ें (उदा. Next.js, Redux)' : 'Add specific framework or library (e.g. Next.js, Redux, AWS S3)'}
            value={customTech}
            onChange={(e) => setCustomTech(e.target.value)}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
          />
          <Button type="submit" size="sm" variant="outline" leftIcon={<Plus size={14} />} className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]">
            {language === 'ta' ? 'சேர்' : language === 'hi' ? 'जोड़ें' : 'Add Tag'}
          </Button>
        </form>
      </Card>

      {/* 4. Length & AI Persona */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Session Length & Pace */}
        <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs space-y-3">
          <CardTitle className="text-sm font-bold text-[#172033]">{t('interviewSetup.durationLabel', 'Session Pacing & Questions')}</CardTitle>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-[#172033]">{t('interviewSetup.questionCount', 'Number of Questions')}:</span>
              <span className="font-bold text-accent-600">{questionCount}</span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-accent-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-[#172033]">{t('interviewSetup.durationLabel', 'Target Time Budget')}:</span>
              <span className="font-bold text-accent-600">{durationMinutes} {t('interviewSetup.mins', 'Minutes')}</span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full accent-accent-600"
            />
            <p className="text-[11px] text-[#64748B] mt-1">
              ~{Math.round((durationMinutes * 60) / questionCount)} seconds per question.
            </p>
          </div>
        </Card>

        {/* AI Interviewer Persona */}
        <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs space-y-3">
          <CardTitle className="text-sm font-bold text-[#172033]">{t('interviewSetup.personaLabel', 'Interviewer Demeanor')}</CardTitle>

          <div className="space-y-2">
            {INTERVIEWER_PERSONAS.map((persona) => {
              const isSelected = selectedPersona === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-accent-600 bg-accent-600/5 ring-1 ring-accent-600'
                      : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-accent-600/10 text-accent-600 flex items-center justify-center font-bold text-xs border border-accent-600/20">
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#172033]">{persona.name}</h4>
                      <p className="text-[10px] text-[#64748B]">{persona.role} • {persona.style}</p>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-accent-600" />}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Launch Actions */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-[#172033]">{language === 'ta' ? 'அமர்வு தயார்' : language === 'hi' ? 'सत्र तैयार है' : 'Configuration Ready'}</h4>
          <p className="text-xs text-[#64748B] mt-0.5">
            {selectedRole} • {selectedDifficulty.toUpperCase()} • {questionCount} questions • Mode: {practiceMode.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            size="md"
            className="w-full sm:w-auto bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold px-6 shadow-xs"
            rightIcon={<ChevronRight size={16} />}
            onClick={() => handleStartInterview()}
          >
            {t('interviewSetup.startSessionButton', 'Launch Interview Session')}
          </Button>
        </div>
      </div>
    </div>
  );
}
