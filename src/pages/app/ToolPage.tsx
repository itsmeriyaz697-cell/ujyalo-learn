import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookmarkPlus, Copy, RefreshCw, Sparkles, Square, Wand2 } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Markdown } from '@/components/markdown/Markdown';
import { AiStatusBanner } from '@/components/app/AiStatusBanner';
import { PageHeading } from '@/components/app/PageHeading';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { useAiHealth } from '@/hooks/useAiHealth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { runStudyTool } from '@/services/ai/client';
import { STUDY_TOOLS, SUBJECTS, getSubject } from '@/config/curriculum';
import { noteFromAi } from '@/lib/notes';
import { makeId } from '@/lib/utils';
import type { StudyToolId } from '@shared/constants';

interface ToolConfig {
  id: StudyToolId;
  label: string;
  intro: string;
  inputLabel: string;
  placeholder: string;
  example: string;
  rows: number;
}

const CONFIGS: Record<string, ToolConfig> = {
  'revision-summary': {
    id: 'revision-summary',
    label: 'Revision summary',
    intro: 'Get a concise revision sheet: key concepts, definitions, formulas, examples, common mistakes and practice questions.',
    inputLabel: 'Topic or your notes',
    placeholder: 'e.g. Photosynthesis for Grade 10, or paste your class notes here.',
    example: 'Photosynthesis for Grade 10 science',
    rows: 8,
  },
  'formula-helper': {
    id: 'formula-helper',
    label: 'Formula helper',
    intro: 'Understand what a formula means, what each variable and unit is, when to use it, and a worked example.',
    inputLabel: 'Formula or topic',
    placeholder: 'e.g. v = u + at, or "area of a triangle"',
    example: 'v = u + at',
    rows: 3,
  },
  'writing-assistant': {
    id: 'writing-assistant',
    label: 'Writing assistant',
    intro: 'Paste your writing to get a corrected version plus an explanation of each change — grammar, clarity, structure and vocabulary.',
    inputLabel: 'Your writing',
    placeholder: 'Paste a paragraph or short essay. Aim for under 4,000 characters.',
    example: 'last week me and my friend go to the library for study about environment pollution.',
    rows: 9,
  },
  'question-explainer': {
    id: 'question-explainer',
    label: 'Question explainer',
    intro: 'Paste a question you are stuck on to get a grade-appropriate walkthrough of how to approach it.',
    inputLabel: 'Your question',
    placeholder: 'e.g. A car accelerates from 10 m/s to 30 m/s in 5 seconds. What is its acceleration?',
    example: 'A car accelerates from 10 m/s to 30 m/s in 5 seconds. What is its acceleration?',
    rows: 5,
  },
};

export default function ToolPage() {
  const { toolId } = useParams();
  const config = toolId ? CONFIGS[toolId] : undefined;
  const { user, profile } = useAuth();
  const { saveNote, notes, logActivity } = useData();
  const { toast } = useToast();
  const { health, loading: healthLoading, refresh } = useAiHealth();
  const online = useOnlineStatus();

  const [input, setInput] = useState('');
  const [subject, setSubject] = useState(profile?.preferences.subjects[0] ?? 'science');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (!config) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          Tool not found
        </h1>
        <p className="mt-1 text-sm text-muted">That study tool does not exist.</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to="/app/tools">Back to tools</Link>
        </Button>
      </div>
    );
  }

  async function run() {
    if (!input.trim()) {
      setError('Please add something to work with first.');
      return;
    }
    if (!online) {
      setError('You are offline. AI tools need an internet connection.');
      return;
    }
    setError(null);
    setOutput('');
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let buffer = '';
    let frame: number | null = null;
    const flush = () => {
      frame = null;
      if (!buffer) return;
      const chunk = buffer;
      buffer = '';
      setOutput((current) => current + chunk);
    };

    try {
      const result = await runStudyTool({
        tool: config!.id,
        input: input.trim(),
        subject: getSubject(subject)?.name ?? subject,
        grade: profile?.preferences.grade ?? '10',
        language: profile?.preferences.language ?? 'en',
        signal: controller.signal,
        onDelta: (text) => {
          buffer += text;
          if (frame === null) frame = requestAnimationFrame(flush);
        },
      });
      if (frame !== null) cancelAnimationFrame(frame);
      flush();
      setOutput(result.text);
      logActivity('tutor', `${config!.label}: ${input.trim().slice(0, 60)}`, { subjectId: subject });
    } catch (runError) {
      if (frame !== null) cancelAnimationFrame(frame);
      flush();
      if ((runError as Error).name === 'AbortError') {
        setError('Stopped.');
      } else {
        setError((runError as Error).message || 'The tool could not complete. Please try again.');
      }
    } finally {
      abortRef.current = null;
      setRunning(false);
    }
  }

  async function saveToNotes() {
    if (!user || !output.trim()) return;
    try {
      await saveNote(
        noteFromAi({
          ownerId: user.uid,
          id: makeId('note'),
          title: `${config!.label}: ${input.trim().slice(0, 70)}`,
          content: output,
          subjectId: subject,
          topic: input.trim().slice(0, 120),
        }),
      );
      toast('Saved to your notes', 'success');
    } catch (saveError) {
      toast((saveError as Error).message || 'Could not save the note.', 'error');
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      toast('Copied to clipboard', 'success');
    } catch {
      toast('Copy failed. Select the text and copy manually.', 'error');
    }
  }

  const alreadySaved = output.trim().length > 0 && notes.some((note) => note.content === output);

  return (
    <>
      <Seo title={config.label} description={config.intro} path={`/app/tools/${config.id}`} noindex />
      <div className="mb-3">
        <Button asChild variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
          <Link to="/app/tools">All tools</Link>
        </Button>
      </div>
      <PageHeading title={config.label} description={config.intro} />

      <AiStatusBanner health={health} loading={healthLoading} onRetry={refresh} />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Your input" description="Only what you type here is sent to the AI provider." icon={<Wand2 className="h-4 w-4" />} />
          <CardBody>
            <div className="space-y-3">
              <Select label="Subject context" value={subject} onChange={(event) => setSubject(event.target.value)}>
                {SUBJECTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>

              <Textarea
                label={config.inputLabel}
                rows={config.rows}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={config.placeholder}
                maxLength={6000}
                hint={`${input.length}/6000 characters · grade ${profile?.preferences.grade ?? '10'}`}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={run}
                  loading={running}
                  disabled={!health?.configured || !input.trim()}
                  icon={<Sparkles className="h-4 w-4" />}
                >
                  {running ? 'Working…' : `Run ${config.label.toLowerCase()}`}
                </Button>
                {running ? (
                  <Button variant="secondary" onClick={() => abortRef.current?.abort()} icon={<Square className="h-3.5 w-3.5" />}>
                    Stop
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput(config.example)}
                    icon={<RefreshCw className="h-3.5 w-3.5" />}
                  >
                    Use example
                  </Button>
                )}
              </div>

              {error && (
                <p className="rounded-lg px-3 py-2 text-sm" role="alert" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                  {error}
                </p>
              )}

              {!online && <InlineAlert tone="warning">You are offline. AI tools need an internet connection.</InlineAlert>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Result"
            description={output ? 'AI-generated. Check important details.' : 'Your result will appear here.'}
            icon={<Sparkles className="h-4 w-4" />}
            action={
              output ? (
                <div className="flex gap-1">
                  <button type="button" className="btn-icon !h-8 !w-8" onClick={copyOutput} aria-label="Copy result" title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon !h-8 !w-8"
                    onClick={saveToNotes}
                    aria-label="Save result to notes"
                    title={alreadySaved ? 'Already saved' : 'Save to notes'}
                    disabled={alreadySaved}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : undefined
            }
          />
          <CardBody>
            {running && !output && (
              <div className="flex items-center gap-2 py-10 text-sm text-muted">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full" style={{ background: 'var(--primary)' }} />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full [animation-delay:150ms]" style={{ background: 'var(--primary)' }} />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full [animation-delay:300ms]" style={{ background: 'var(--primary)' }} />
                </span>
                Working on it…
              </div>
            )}

            {output ? (
              <>
                <Markdown content={output} streaming={running} />
                {alreadySaved && <p className="mt-3 text-[11px] text-muted">Saved to your notes.</p>}
              </>
            ) : (
              !running && (
                <div className="py-10 text-center">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                    aria-hidden="true"
                  >
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Nothing here yet
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted">
                    Add your {config.inputLabel.toLowerCase()} and press run. Results are AI-generated and may contain errors.
                  </p>
                </div>
              )
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <InlineAlert tone="info" title="How this works">
          This tool uses the same secure server endpoint as the AI tutor. Your provider API key never reaches the browser. All
          study tools are rate-limited with the same daily allowance.
        </InlineAlert>
      </div>

      <p className="mt-3 text-center text-[11px] text-muted">
        Related: {STUDY_TOOLS.filter((tool) => tool.id !== config.id).map((tool) => tool.label).join(' · ')}
      </p>
    </>
  );
}
