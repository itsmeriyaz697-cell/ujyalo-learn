/**
 * Firestore rejects documents containing `undefined`:
 *
 *   Function setDoc() called with invalid data. Unsupported field value:
 *   undefined (found in field notice in document users/…/messages/…)
 *
 * Almost every object in this app has optional fields (a message's `notice`, a
 * note's `subjectId`, a goal's `targetDate`). Writing `{ ...object }` sends
 * those keys with the value `undefined` whenever they are unset, so a perfectly
 * ordinary write — the assistant's reply, which normally has no notice at all —
 * was rejected and the conversation history was silently lost.
 *
 * Dropping the key is the correct behaviour: an absent optional field and an
 * unset optional field mean the same thing here, and `undefined` cannot be
 * stored. `null` is kept, because the codebase uses it deliberately for
 * "explicitly empty" values.
 */
export function toFirestore<T>(value: T): T {
  return strip(value) as T;
}

function strip(value: unknown): unknown {
  if (value === undefined) return undefined; // removed by the caller
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value
      .map((item) => strip(item))
      // Firestore cannot hold `undefined` inside an array either.
      .filter((item) => item !== undefined);
  }
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      if (item === undefined) continue;
      const cleaned = strip(item);
      if (cleaned === undefined) continue;
      output[key] = cleaned;
    }
    return output;
  }
  return value;
}
