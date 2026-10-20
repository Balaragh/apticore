import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Filter, Clock, CheckCircle2, Play, Sparkles,
  Bookmark, ChevronRight, Video, Award, ArrowRight, Layers, Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PRACTICE_COURSES, type PracticeCourse, type CourseLesson } from '@/lib/courses-data';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Fundamentals', 'Languages', 'Core CS', 'Web & Systems', 'Interview Prep'] as const;

export default function CoursesPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<PracticeCourse | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);

  // Completed lesson IDs stored in localStorage
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apticore_completed_lessons');
      return saved ? JSON.parse(saved) : ['pf-1'];
    } catch {
      return ['pf-1'];
    }
  });

  // Bookmarked courses
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apticore_bookmarked_courses');
      return saved ? JSON.parse(saved) : ['dsa', 'dbms-sql'];
    } catch {
      return ['dsa', 'dbms-sql'];
    }
  });

  const toggleBookmark = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedCourseIds.includes(courseId)
      ? bookmarkedCourseIds.filter((id) => id !== courseId)
      : [...bookmarkedCourseIds, courseId];
    setBookmarkedCourseIds(updated);
    try {
      localStorage.setItem('apticore_bookmarked_courses', JSON.stringify(updated));
    } catch {}
    toast.success(
      bookmarkedCourseIds.includes(courseId) ? 'Course removed from bookmarks' : 'Course bookmarked for quick review'
    );
  };

  const toggleLessonCompleted = (lessonId: string) => {
    const isCompleted = completedLessonIds.includes(lessonId);
    const updated = isCompleted
      ? completedLessonIds.filter((id) => id !== lessonId)
      : [...completedLessonIds, lessonId];
    setCompletedLessonIds(updated);
    try {
      localStorage.setItem('apticore_completed_lessons', JSON.stringify(updated));
    } catch {}
    toast.success(isCompleted ? 'Marked as uncompleted' : 'Lesson marked as completed! 🎉');
  };

  // Filtered courses
  const filteredCourses = PRACTICE_COURSES.filter((course) => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCourseProgress = (course: PracticeCourse) => {
    if (course.lessons.length === 0) return 0;
    const completedCount = course.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
    return Math.round((completedCount / course.lessons.length) * 100);
  };

  const totalCompletedLessons = completedLessonIds.length;
  const totalCourses = PRACTICE_COURSES.length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              {t('nav.courses')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
              {PRACTICE_COURSES.length} Curated Tracks
            </span>
          </div>
          <p className="text-surface-500 text-sm mt-1">
            Structured curriculum covering CS fundamentals, modern languages, systems design, and behavioral frameworks.
          </p>
        </div>

        {/* Quick Launch Video Interview */}
        <Button
          onClick={() => navigate('/interview/course-video')}
          leftIcon={<Video size={16} />}
          className="shadow-sm shadow-accent-600/20"
        >
          {t('nav.courseVideo')}
        </Button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, algorithms, languages..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-surface-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-accent-600 text-white shadow-xs'
                  : 'bg-white dark:bg-navy-900 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-navy-700 hover:border-surface-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Course Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const progress = getCourseProgress(course);
          const isBookmarked = bookmarkedCourseIds.includes(course.id);

          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className="bg-white dark:bg-navy-900 rounded-2xl border border-surface-200 dark:border-navy-700 p-5 hover:border-accent-300 dark:hover:border-accent-600 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Top badges & Bookmark */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-100 dark:bg-navy-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-navy-700">
                      {course.category}
                    </span>
                    <Badge
                      variant={
                        course.difficulty === 'Advanced'
                          ? 'error'
                          : course.difficulty === 'Intermediate'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {course.difficulty}
                    </Badge>
                  </div>

                  <button
                    onClick={(e) => toggleBookmark(course.id, e)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-amber-500 hover:bg-surface-100 dark:hover:bg-navy-800 transition-colors"
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark course'}
                  >
                    <Bookmark
                      size={16}
                      className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''}
                    />
                  </button>
                </div>

                {/* Course Title & Description */}
                <h3 className="font-bold text-base text-navy-900 dark:text-white group-hover:text-accent-600 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {course.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-surface-50 dark:bg-navy-800 text-surface-500 border border-surface-200/60 dark:border-navy-700/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress & Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-surface-100 dark:border-navy-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-surface-400 flex items-center gap-1 text-[11px]">
                    <Clock size={12} /> ~{course.estimatedHours} hrs • {course.lessons.length} lessons
                  </span>
                  <span className="font-bold text-navy-800 dark:text-white text-[11px]">
                    {progress}%
                  </span>
                </div>

                <div className="w-full bg-surface-100 dark:bg-navy-800 h-1.5 rounded-full overflow-hidden mb-3.5">
                  <div
                    className="bg-accent-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourse(course);
                    }}
                  >
                    View Syllabus
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/interview/course-video?courseId=${course.id}`);
                    }}
                    rightIcon={<Play size={12} />}
                  >
                    AI Interview
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Course Detail & Syllabus Modal */}
      <Modal
        isOpen={!!selectedCourse}
        onClose={() => {
          setSelectedCourse(null);
          setActiveLesson(null);
        }}
        size="lg"
        title={selectedCourse?.title}
      >
        {selectedCourse && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-semibold">
                  {selectedCourse.category}
                </span>
                <span className="text-surface-400">
                  {selectedCourse.lessons.length} Lessons • {selectedCourse.practiceQuestionCount} Practice Questions
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const id = selectedCourse.id;
                  setSelectedCourse(null);
                  navigate(`/interview/course-video?courseId=${id}`);
                }}
                leftIcon={<Video size={14} />}
              >
                Start AI Interview on this Course
              </Button>
            </div>

            <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
              {selectedCourse.description}
            </p>

            {/* Lesson List */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-surface-400">
                Course Syllabus & Interactive Lessons
              </h4>

              {selectedCourse.lessons.map((lesson, idx) => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className="p-3.5 rounded-xl border border-surface-200 dark:border-navy-700 bg-surface-50/50 dark:bg-navy-800/40 hover:bg-white dark:hover:bg-navy-800 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent-600 dark:text-accent-400">
                          Lesson {idx + 1}:
                        </span>
                        <h5 className="font-bold text-sm text-navy-900 dark:text-white">
                          {lesson.title}
                        </h5>
                      </div>
                      <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                        {lesson.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {lesson.keyConcepts.map((kc) => (
                          <span
                            key={kc}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-surface-100 dark:bg-navy-700 text-surface-600 dark:text-surface-300"
                          >
                            ✓ {kc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[11px] text-surface-400 flex items-center gap-1">
                        <Clock size={11} /> {lesson.durationMinutes}m
                      </span>

                      <button
                        onClick={() => toggleLessonCompleted(lesson.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-white dark:bg-navy-700 text-surface-600 border border-surface-200 dark:border-navy-600 hover:text-navy-900'
                        }`}
                      >
                        <CheckCircle2 size={13} className={isCompleted ? 'text-emerald-600' : 'text-surface-400'} />
                        {isCompleted ? 'Completed' : 'Mark Done'}
                      </button>

                      <button
                        onClick={() => setActiveLesson(lesson)}
                        className="text-xs text-accent-600 dark:text-accent-400 font-semibold hover:underline"
                      >
                        Read Notes →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Lesson Reader Modal */}
      <Modal
        isOpen={!!activeLesson}
        onClose={() => setActiveLesson(null)}
        size="lg"
        title={activeLesson?.title}
      >
        {activeLesson && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-surface-400 border-b border-surface-100 dark:border-navy-800 pb-2">
              <span>Estimated Reading Time: {activeLesson.durationMinutes} mins</span>
              <button
                onClick={() => toggleLessonCompleted(activeLesson.id)}
                className="text-accent-600 hover:underline font-semibold flex items-center gap-1"
              >
                <CheckCircle2 size={13} />
                {completedLessonIds.includes(activeLesson.id) ? 'Lesson Completed' : 'Mark as Completed'}
              </button>
            </div>

            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
              <div className="p-3 bg-surface-50 dark:bg-navy-800 rounded-xl border border-surface-200 dark:border-navy-700">
                <p className="font-semibold text-navy-800 dark:text-white text-xs mb-1">
                  Core Takeaways:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-surface-600 dark:text-surface-300">
                  {activeLesson.keyConcepts.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="whitespace-pre-line text-surface-700 dark:text-surface-200">
                {activeLesson.contentMarkdown}
              </div>

              <div className="p-3.5 bg-accent-50/50 dark:bg-accent-950/20 rounded-xl border border-accent-200/50 dark:border-accent-800/40 mt-4">
                <p className="font-bold text-accent-800 dark:text-accent-300 text-xs mb-1.5 flex items-center gap-1.5">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  Actual Interview Questions from this Lesson:
                </p>
                <ul className="space-y-1 text-xs text-navy-800 dark:text-surface-200">
                  {activeLesson.interviewQuestions.map((iq) => (
                    <li key={iq} className="flex items-start gap-2">
                      <span className="text-accent-600 font-bold">•</span>
                      <span>{iq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-surface-100 dark:border-navy-800">
              <Button size="sm" onClick={() => setActiveLesson(null)}>
                Done Reading
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
