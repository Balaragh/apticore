import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, Bookmark, BookmarkCheck, Filter, Play, Plus,
  Sparkles, CheckCircle2, ChevronRight, X, Clock, HelpCircle, Video,
  Briefcase, Save, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { STARCoach } from '@/components/interview/star-coach';
import { DEMO_BANK_QUESTIONS } from '@/lib/mock-data';
import {
  getBookmarkedQuestionIds,
  toggleBookmarkQuestion,
  saveAnswerNote,
  getSavedNotes,
} from '@/lib/storage';
import type { BankQuestion, InterviewType, Difficulty } from '@/types';
import toast from 'react-hot-toast';

const ROLES = [
  'All Roles',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
];

export default function QuestionBankPage() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<BankQuestion[]>(DEMO_BANK_QUESTIONS);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Modal states
  const [practiceQuestion, setPracticeQuestion] = useState<BankQuestion | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [showStarCoach, setShowStarCoach] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [practiceResult, setPracticeResult] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionTopic, setNewQuestionTopic] = useState('React');
  const [newQuestionRole, setNewQuestionRole] = useState('Frontend Developer');
  const [newQuestionType, setNewQuestionType] = useState<InterviewType>('technical');
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<Difficulty>('medium');

  // Sync bookmarks from storage
  useEffect(() => {
    const saved = getBookmarkedQuestionIds();
    setBookmarkedIds(saved);
  }, []);

  // Unique topics
  const topics = useMemo(() => {
    const set = new Set(questions.map((q) => q.topic));
    return ['all', ...Array.from(set)];
  }, [questions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Role filter
      if (selectedRole !== 'All Roles') {
        const qRole = (q.role || '').toLowerCase();
        const filterRole = selectedRole.toLowerCase();
        if (qRole !== 'common' && !qRole.includes(filterRole.split(' ')[0])) {
          return false;
        }
      }

      // Type / Saved filter
      if (selectedType === 'saved') {
        if (!bookmarkedIds.includes(q.id)) return false;
      } else if (selectedType !== 'all') {
        if (q.type !== selectedType) return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // Topic filter
      if (selectedTopic !== 'all' && q.topic !== selectedTopic) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = q.text.toLowerCase().includes(query);
        const matchesTopic = q.topic.toLowerCase().includes(query);
        const matchesTags = q.tags.some((t) => t.toLowerCase().includes(query));
        return matchesText || matchesTopic || matchesTags;
      }

      return true;
    });
  }, [questions, searchQuery, selectedRole, selectedType, selectedDifficulty, selectedTopic, bookmarkedIds]);

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleBookmarkQuestion(id);
    setBookmarkedIds(updated);
    toast.success(updated.includes(id) ? 'Question bookmarked' : 'Bookmark removed');
  };

  const handleStartPractice = (q: BankQuestion) => {
    setPracticeQuestion(q);
    const savedNotes = getSavedNotes()[q.id] || '';
    setPracticeAnswer(savedNotes);
    setPracticeResult(null);
    setShowStarCoach(q.type === 'behavioral');
  };

  const handleLaunchInVideo = (q: BankQuestion, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sessionStorage.setItem(
      'apticore_active_config',
      JSON.stringify({
        role: q.role || 'Frontend Developer',
        difficulty: q.difficulty,
        type: q.type,
        questionCount: 3,
        durationMinutes: 10,
      })
    );
    navigate(`/interview/video?role=${encodeURIComponent(q.role || 'Frontend Developer')}`);
  };

  const handleGradePracticeAnswer = () => {
    if (!practiceAnswer.trim()) {
      toast.error('Please write an answer before submitting for evaluation');
      return;
    }

    // Save locally
    if (practiceQuestion) {
      saveAnswerNote(practiceQuestion.id, practiceAnswer);
    }

    setIsGrading(true);
    setTimeout(() => {
      setIsGrading(false);
      setPracticeResult(
        'Simulated Score: 88/100! Solid conceptual breakdown. You articulated the core mechanism, covered the primary trade-offs, and organized your points cleanly.'
      );
      // Increment practice count
      if (practiceQuestion) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === practiceQuestion.id
              ? { ...q, practiceCount: q.practiceCount + 1, lastPracticed: new Date().toISOString().split('T')[0] }
              : q
          )
        );
      }
      toast.success('Practice answer evaluated and saved!');
    }, 1200);
  };

  const handleCreateCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQ: BankQuestion = {
      id: `custom-${Date.now()}`,
      text: newQuestionText.trim(),
      type: newQuestionType,
      difficulty: newQuestionDifficulty,
      topic: newQuestionTopic,
      role: newQuestionRole,
      tags: [newQuestionTopic.toLowerCase(), 'custom'],
      practiceCount: 0,
      isSaved: true,
    };

    setQuestions([newQ, ...questions]);
    setShowAddModal(false);
    setNewQuestionText('');
    toast.success('Custom question added to your bank!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
              Curated Library
            </span>
            <span className="text-xs text-surface-400">{filteredQuestions.length} questions available</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800 dark:text-white mt-1">
            Question Bank & STAR Coach
          </h1>
          <p className="text-surface-500 text-sm mt-0.5">
            Filter by engineering role, category, and difficulty. Practice individually with the STAR coach or launch directly into video mode.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Custom Question
        </Button>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              selectedRole === role
                ? 'bg-accent-600 text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-navy-900 border border-surface-200 dark:border-navy-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <Card padding="md" className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by keywords, tags, or concepts (e.g. Virtual DOM, closures, rate limiter, Spring Boot, event loop)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 dark:border-navy-700 bg-surface-50 dark:bg-navy-950 text-xs sm:text-sm text-navy-800 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-navy-800 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Row 1: Types & Saved */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-200 dark:border-navy-700">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'technical', label: 'Technical' },
              { id: 'behavioral', label: 'Behavioral' },
              { id: 'system-design', label: 'System Design' },
              { id: 'saved', label: 'Bookmarked ⭐' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === tab.id
                    ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-semibold border border-accent-200 dark:border-accent-800/50'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-navy-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Row 2: Difficulty & Topic Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-surface-200 dark:border-navy-700 bg-surface-50 dark:bg-navy-800 text-navy-800 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Beginner / Easy</option>
              <option value="medium">Intermediate / Medium</option>
              <option value="hard">Advanced / Hard</option>
            </select>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-surface-200 dark:border-navy-700 bg-surface-50 dark:bg-navy-800 text-navy-800 dark:text-white"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All Topics' : t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Question List */}
      {filteredQuestions.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <BookOpen size={40} className="mx-auto text-surface-300 mb-3" />
          <h3 className="text-base font-bold text-navy-800 dark:text-white">No questions matched your filters</h3>
          <p className="text-xs text-surface-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, role selection, or difficulty filters.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredQuestions.map((q) => {
            const isBookmarked = bookmarkedIds.includes(q.id);
            return (
              <Card
                key={q.id}
                padding="md"
                className="flex flex-col justify-between hover:border-accent-300 dark:hover:border-accent-700 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-100 dark:bg-navy-800 text-surface-600 dark:text-surface-300">
                        {q.topic}
                      </span>
                      <Badge
                        variant={
                          q.difficulty === 'hard' ? 'error' : q.difficulty === 'medium' ? 'warning' : 'success'
                        }
                        size="sm"
                      >
                        {q.difficulty}
                      </Badge>
                      {q.role && (
                        <span className="text-[10px] text-surface-400">
                          • {q.role}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => toggleSave(q.id, e)}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-amber-500 transition-colors"
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck size={18} className="text-amber-500 fill-amber-500" />
                      ) : (
                        <Bookmark size={18} />
                      )}
                    </button>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-navy-900 dark:text-white mt-2.5 leading-relaxed">
                    {q.text}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-100 dark:border-navy-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-surface-400">
                    Practiced {q.practiceCount} {q.practiceCount === 1 ? 'time' : 'times'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleLaunchInVideo(q, e)}
                      className="px-2.5 py-1 rounded-lg border border-accent-300 dark:border-accent-800 text-accent-700 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-950/40 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="Practice this question in Video mode"
                    >
                      <Video size={12} /> Video Mode
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      rightIcon={<ChevronRight size={14} />}
                      onClick={() => handleStartPractice(q)}
                      className="text-xs"
                    >
                      Practice
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Practice Modal with STAR Coach & Notes */}
      {practiceQuestion && (
        <Modal
          isOpen={!!practiceQuestion}
          onClose={() => setPracticeQuestion(null)}
          title={`Practice: ${practiceQuestion.topic} (${practiceQuestion.difficulty})`}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-navy-800 border border-surface-200 dark:border-navy-700 space-y-1.5">
              <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wide">
                {practiceQuestion.type} prompt
              </span>
              <p className="text-sm font-semibold text-navy-800 dark:text-white leading-relaxed">
                "{practiceQuestion.text}"
              </p>
            </div>

            {/* Toggle STAR Coach */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-navy-800 dark:text-white">
                Your Answer & Delivery Notes
              </label>
              <button
                type="button"
                onClick={() => setShowStarCoach(!showStarCoach)}
                className="text-xs text-accent-600 dark:text-accent-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles size={13} />
                {showStarCoach ? 'Hide STAR Coach' : 'Use STAR Coach Framework'}
              </button>
            </div>

            {showStarCoach && (
              <STARCoach
                compact
                onApplyStar={(text) => setPracticeAnswer(text)}
              />
            )}

            <div>
              <textarea
                value={practiceAnswer}
                onChange={(e) => setPracticeAnswer(e.target.value)}
                placeholder="Write your explanation, approach, or STAR structured response here..."
                rows={6}
                className="w-full p-3 rounded-xl border border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs sm:text-sm text-navy-800 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500 leading-relaxed resize-none font-sans"
              />
              <p className="text-[10px] text-surface-400 mt-1">
                Your answer is automatically saved to your local training history.
              </p>
            </div>

            {/* AI Grading result */}
            {practiceResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300"
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles size={14} className="text-emerald-500" />
                  Practice Feedback Model:
                </div>
                <p>{practiceResult}</p>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-navy-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLaunchInVideo(practiceQuestion)}
                leftIcon={<Video size={14} />}
              >
                Launch in Video Mode
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPracticeQuestion(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={handleGradePracticeAnswer}
                  disabled={isGrading}
                  leftIcon={isGrading ? undefined : <Sparkles size={14} />}
                >
                  {isGrading ? 'Evaluating...' : 'Save & Evaluate'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Custom Question Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Custom Question to Bank"
      >
        <form onSubmit={handleCreateCustomQuestion} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
              Question Text
            </label>
            <textarea
              required
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="e.g. How does the browser determine CSS specificity?"
              rows={3}
              className="w-full p-3 rounded-xl border border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                Target Role
              </label>
              <select
                value={newQuestionRole}
                onChange={(e) => setNewQuestionRole(e.target.value)}
                className="w-full p-2 rounded-lg border border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-navy-800 dark:text-white"
              >
                {ROLES.filter((r) => r !== 'All Roles').map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                Topic
              </label>
              <input
                type="text"
                required
                value={newQuestionTopic}
                onChange={(e) => setNewQuestionTopic(e.target.value)}
                className="w-full p-2 rounded-lg border border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-navy-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                Type
              </label>
              <select
                value={newQuestionType}
                onChange={(e) => setNewQuestionType(e.target.value as InterviewType)}
                className="w-full p-2 rounded-lg border border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-navy-800 dark:text-white"
              >
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="system-design">System Design</option>
                <option value="hr">HR</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-300 block mb-1">
                Difficulty
              </label>
              <select
                value={newQuestionDifficulty}
                onChange={(e) => setNewQuestionDifficulty(e.target.value as Difficulty)}
                className="w-full p-2 rounded-lg border border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-navy-800 dark:text-white"
              >
                <option value="easy">Beginner / Easy</option>
                <option value="medium">Intermediate / Medium</option>
                <option value="hard">Advanced / Hard</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save to Question Bank
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
