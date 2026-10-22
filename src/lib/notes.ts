import type { Note } from '@/types/domain';
import { normalizeAnswer } from './quiz';

/** Case-insensitive search across note title, content, topic and tags. */
export function searchNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  const terms = q.split(/\s+/);
  return notes.filter((note) => {
    const haystack = `${note.title} ${note.content} ${note.topic} ${note.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

/** Finds notes most relevant to a topic, used for flashcard suggestions. */
export function relevantNotes(notes: Note[], topic: string, subjectId?: string | null): Note[] {
  const q = topic.trim().toLowerCase();
  const scored = notes.map((note) => {
    let score = 0;
    if (subjectId && note.subjectId === subjectId) score += 2;
    if (note.title.toLowerCase().includes(q)) score += 3;
    if (note.topic.toLowerCase().includes(q)) score += 2;
    if (note.content.toLowerCase().includes(q)) score += 1;
    if (note.favorite) score += 0.5;
    return { note, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.note);
}

/** Builds a short plain-text preview from markdown content. */
export function notePreview(content: string, max = 160): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~$-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

export function noteFromAi(input: {
  ownerId: string;
  id: string;
  title: string;
  content: string;
  subjectId: string | null;
  topic?: string;
  now?: Date;
}): Note {
  const now = (input.now ?? new Date()).toISOString();
  return {
    id: input.id,
    ownerId: input.ownerId,
    title: input.title.slice(0, 160),
    content: input.content,
    subjectId: input.subjectId,
    topic: input.topic ?? '',
    source: 'ai',
    favorite: false,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Loose duplicate detection so the same explanation is not saved twice. */
export function isDuplicateNote(notes: Note[], content: string): boolean {
  const target = normalizeAnswer(content).slice(0, 500);
  return notes.some((n) => normalizeAnswer(n.content).slice(0, 500) === target);
}
