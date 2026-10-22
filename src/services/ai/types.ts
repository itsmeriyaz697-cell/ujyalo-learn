import type { StudentPreferences } from '@/types/domain';
import type { StudyToolId, TutorModeId } from '@shared/constants';

export interface AiErrorShape {
  code: string;
  message: string;
  status?: number;
}

export interface AiHealth {
  configured: boolean;
  provider?: string;
  model?: string;
  /** True when the endpoint requires sign-in. */
  authRequired?: boolean;
  limits?: { perMinute: number; perDay: number };
  checkedAt: number;
}

export interface TutorContext extends Partial<StudentPreferences> {
  studentName?: string;
}

export interface SendTutorOptions {
  mode: TutorModeId;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context: TutorContext;
  subjectId?: string | null;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onNotice?: (text: string) => void;
}

export interface TutorResult {
  text: string;
  notice?: string;
  authWarning?: boolean;
}

export interface ToolGenerationOptions {
  tool: StudyToolId;
  input: string;
  subject?: string;
  grade: string;
  language: string;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

export interface IdTokenProvider {
  getIdToken(): Promise<string | null>;
}
