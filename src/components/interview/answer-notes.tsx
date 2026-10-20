import { useState, useEffect } from 'react';
import {
  FileText, Mic, MicOff, Save, Check, Copy, Sparkles, BookOpen
} from 'lucide-react';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '@/lib/speech';
import { saveAnswerNote, getSavedNotes } from '@/lib/storage';
import toast from 'react-hot-toast';

interface AnswerNotesProps {
  questionId: string;
  initialValue?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  minRows?: number;
}

export function AnswerNotes({
  questionId,
  initialValue = '',
  onChange,
  placeholder = 'Type your answer, bullet points, or thoughts here...',
  minRows = 6,
}: AnswerNotesProps) {
  const [content, setContent] = useState(initialValue);
  const [isDictating, setIsDictating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);

  // Sync when initialValue or questionId changes
  useEffect(() => {
    const saved = getSavedNotes()[questionId];
    setContent(initialValue || saved || '');
  }, [questionId, initialValue]);

  // Initialize speech recognition if available
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      const rec = createSpeechRecognizer(
        (chunk, isFinal) => {
          setContent((prev) => {
            const next = prev ? `${prev} ${chunk}` : chunk;
            onChange?.(next);
            return next;
          });
          if (isFinal) {
            setIsSaved(false);
          }
        },
        (err) => {
          setIsDictating(false);
          toast.error(`Dictation note: ${err}`);
        }
      );
      setRecognizer(rec);
    }
  }, [onChange]);

  const toggleDictation = () => {
    if (!recognizer) {
      toast.error('Voice dictation is not supported in this browser. You can type freely.');
      return;
    }

    if (isDictating) {
      recognizer.stop();
      setIsDictating(false);
      toast('Voice dictation paused', { icon: '🎙️' });
    } else {
      recognizer.start();
      setIsDictating(true);
      toast.success('Voice dictation active. Speak clearly into your microphone.');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setIsSaved(false);
    onChange?.(val);
  };

  const handleManualSave = () => {
    saveAnswerNote(questionId, content);
    setIsSaved(true);
    toast.success('Answer notes saved!');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white dark:bg-navy-900 border border-surface-200 dark:border-navy-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-surface-50 dark:bg-navy-800/60 border-b border-surface-200 dark:border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-accent-500" />
          <span className="text-xs font-semibold text-navy-800 dark:text-white">
            Candidate Answer & Practice Notes
          </span>
          <span className="text-[10px] text-surface-400">
            ({words} {words === 1 ? 'word' : 'words'})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dictate Button */}
          {isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={toggleDictation}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                isDictating
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-navy-700'
              }`}
              title="Dictate with voice"
            >
              {isDictating ? <MicOff size={13} /> : <Mic size={13} />}
              <span className="hidden sm:inline">{isDictating ? 'Stop' : 'Dictate'}</span>
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleManualSave}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-accent-700 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-950/40 flex items-center gap-1 transition-colors"
          >
            {isSaved ? <Check size={13} className="text-emerald-500" /> : <Save size={13} />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="p-3">
        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={minRows}
          className="w-full text-xs sm:text-sm bg-transparent border-0 outline-none text-navy-800 dark:text-surface-100 placeholder:text-surface-400 resize-none leading-relaxed"
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-surface-50/50 dark:bg-navy-950/40 border-t border-surface-100 dark:border-navy-800/60 flex items-center justify-between text-[11px] text-surface-400">
        <span>Auto-saves locally to your training history</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(content);
            toast.success('Notes copied to clipboard');
          }}
          className="hover:text-navy-800 dark:hover:text-white flex items-center gap-1"
        >
          <Copy size={11} /> Copy
        </button>
      </div>
    </div>
  );
}
