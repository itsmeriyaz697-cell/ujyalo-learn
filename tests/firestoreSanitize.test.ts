import { describe, expect, it } from 'vitest';
import { toFirestore } from '@/services/data/sanitize';

/**
 * Regression cover for the production error:
 *
 *   Function setDoc() called with invalid data. Unsupported field value:
 *   undefined (found in field notice in document users/…/messages/…)
 *
 * The assistant's reply normally has no `notice`, so `notice: undefined` was
 * being written on every ordinary tutor answer and the write was rejected.
 */
describe('toFirestore', () => {
  it('drops undefined optional fields from a message', () => {
    const message = {
      id: 'msg_1',
      role: 'assistant',
      content: 'Photosynthesis turns light into chemical energy.',
      notice: undefined,
    };

    const cleaned = toFirestore(message);

    expect(cleaned).toEqual({
      id: 'msg_1',
      role: 'assistant',
      content: 'Photosynthesis turns light into chemical energy.',
    });
    expect('notice' in cleaned).toBe(false);
  });

  it('keeps null, because null is a deliberate value', () => {
    expect(toFirestore({ subjectId: null, notice: undefined })).toEqual({ subjectId: null });
  });

  it('strips undefined from nested objects, which Firestore also rejects', () => {
    const cleaned = toFirestore({
      id: 'deck_1',
      meta: { source: 'ai', reviewedBy: undefined },
      cards: [{ front: 'Q', back: 'A', hint: undefined }],
    });

    expect(cleaned).toEqual({ id: 'deck_1', meta: { source: 'ai' }, cards: [{ front: 'Q', back: 'A' }] });
  });

  it('drops undefined entries inside arrays', () => {
    expect(toFirestore({ tags: ['algebra', undefined, 'see'] })).toEqual({ tags: ['algebra', 'see'] });
  });

  it('keeps primitives, dates and empty strings untouched', () => {
    const when = new Date('2026-10-23T00:00:00.000Z');
    const cleaned = toFirestore({ at: when, count: 0, flag: false, empty: '', n: null });

    expect(cleaned.at).toBe(when);
    expect(cleaned.count).toBe(0);
    expect(cleaned.flag).toBe(false);
    expect(cleaned.empty).toBe('');
    expect(cleaned.n).toBeNull();
  });

  it('does not mutate the input', () => {
    const original = { id: 'x', notice: undefined as string | undefined };
    toFirestore(original);
    expect('notice' in original).toBe(true);
  });
});
