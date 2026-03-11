'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, Loader2, MessageSquare, RefreshCw, Send } from 'lucide-react';
import type { TriageState } from '@/lib/types';

interface TriageChecklistProps {
  taskId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  scope: 'text-mc-accent-purple',
  technical: 'text-mc-accent-cyan',
  design: 'text-mc-accent-green',
  requirements: 'text-mc-accent',
};

export function TriageChecklist({ taskId }: TriageChecklistProps) {
  const [state, setState] = useState<TriageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [retriaging, setRetriaging] = useState(false);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/triage-state`);
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleSubmitAnswer = async (questionId: string) => {
    const answer = drafts[questionId]?.trim();
    if (!answer || submitting) return;

    setSubmitting(questionId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/triage-state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer }),
      });
      if (res.ok) {
        const updated = await res.json();
        setState(updated);
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
      }
    } catch {
    } finally {
      setSubmitting(null);
    }
  };

  const handleSelectOption = async (questionId: string, option: string) => {
    setDrafts((prev) => ({ ...prev, [questionId]: option }));
    setSubmitting(questionId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/triage-state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer: option }),
      });
      if (res.ok) {
        const updated = await res.json();
        setState(updated);
      }
    } catch {
    } finally {
      setSubmitting(null);
    }
  };

  const handleRetriage = async () => {
    setRetriaging(true);
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inbox' }),
      });
      window.location.reload();
    } catch {
      setRetriaging(false);
    }
  };

  if (loading) return null;
  if (!state || !state.questions?.length) return null;

  const answered = state.questions.filter((q) => q.answer);
  const total = state.questions.length;
  const allAnswered = answered.length === total;
  const progress = total > 0 ? (answered.length / total) * 100 : 0;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-mc-text uppercase tracking-wider">
          Triage Questions
        </h3>
        <span className="text-xs text-mc-text-secondary">
          {answered.length} of {total} answered
        </span>
      </div>

      <div className="h-1 bg-mc-bg-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-mc-accent-green rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {state.triage_reasoning && (
        <p className="text-xs text-mc-text-secondary italic">
          {state.triage_reasoning}
        </p>
      )}

      <div className="space-y-3">
        {state.questions.map((q) => (
          <div
            key={q.id}
            className={`rounded-lg border p-3 ${
              q.answer
                ? 'border-mc-accent-green/30 bg-mc-accent-green/5'
                : 'border-mc-border bg-mc-bg-secondary'
            }`}
          >
            <div className="flex items-start gap-2">
              {q.answer ? (
                <CheckCircle className="w-4 h-4 text-mc-accent-green shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-mc-text-secondary shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium uppercase ${CATEGORY_COLORS[q.category] || 'text-mc-text-secondary'}`}>
                    {q.category}
                  </span>
                </div>
                <p className={`text-sm ${q.answer ? 'text-mc-text-secondary' : 'text-mc-text'}`}>
                  {q.question}
                </p>

                {q.answer ? (
                  <p className="text-sm text-mc-accent-green">→ {q.answer}</p>
                ) : q.options?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(q.id, opt)}
                        disabled={submitting === q.id}
                        className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                          drafts[q.id] === opt
                            ? 'border-mc-accent bg-mc-accent/10 text-mc-accent'
                            : 'border-mc-border bg-mc-bg-tertiary text-mc-text-secondary hover:border-mc-accent hover:text-mc-text'
                        }`}
                      >
                        {submitting === q.id && drafts[q.id] === opt ? (
                          <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                        ) : null}
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : q.question_type === 'yes_no' ? (
                  <div className="flex gap-1.5">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(q.id, opt)}
                        disabled={submitting === q.id}
                        className="px-3 py-1.5 text-xs rounded border border-mc-border bg-mc-bg-tertiary text-mc-text-secondary hover:border-mc-accent hover:text-mc-text transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={drafts[q.id] || ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(q.id)}
                      placeholder="Type your answer..."
                      className="flex-1 min-h-9 px-3 text-sm bg-mc-bg-tertiary border border-mc-border rounded text-mc-text placeholder:text-mc-text-secondary/50 focus:outline-none focus:border-mc-accent"
                    />
                    <button
                      onClick={() => handleSubmitAnswer(q.id)}
                      disabled={!drafts[q.id]?.trim() || submitting === q.id}
                      className="min-h-9 min-w-9 flex items-center justify-center rounded bg-mc-accent text-mc-bg hover:bg-mc-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting === q.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {state.context_comments?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-mc-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Linear Context ({state.context_comments.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.context_comments.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-mc-border bg-mc-bg-tertiary p-3 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-mc-accent-cyan text-xs">{c.author}</span>
                  <span className="text-[10px] text-mc-text-secondary">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-mc-text-secondary whitespace-pre-wrap text-xs leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {allAnswered && (
        <button
          onClick={handleRetriage}
          disabled={retriaging}
          className="w-full min-h-11 flex items-center justify-center gap-2 rounded-lg bg-mc-accent text-mc-bg font-medium hover:bg-mc-accent/90 disabled:opacity-50 transition-colors"
        >
          {retriaging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {retriaging ? 'Re-triaging...' : 'All answered — Re-triage'}
        </button>
      )}
    </div>
  );
}
