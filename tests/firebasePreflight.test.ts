import { describe, expect, it } from 'vitest';
import { classifyProbeFailure } from '../src/services/firebase/preflight';

/**
 * The distinction matters: "locked" is the owner's unfinished setup and the
 * message must say no account was created; "unreachable" is the student's
 * connection and telling them to contact support would be wrong.
 */
describe('classifyProbeFailure', () => {
  it('treats a permission-denied from Firestore as unpublished rules', () => {
    expect(classifyProbeFailure({ code: 'permission-denied' })).toBe('locked');
  });

  it('recognises the raw message the SDK sometimes surfaces instead of a code', () => {
    expect(classifyProbeFailure(new Error('Missing or insufficient permissions.'))).toBe('locked');
  });

  it('is case-insensitive about that message', () => {
    expect(classifyProbeFailure(new Error('MISSING OR INSUFFICIENT PERMISSIONS.'))).toBe('locked');
  });

  it('treats a network failure as unreachable, not as a locked database', () => {
    expect(classifyProbeFailure({ code: 'unavailable' })).toBe('unreachable');
  });

  it('never mistakes an unrelated error for locked rules', () => {
    expect(classifyProbeFailure(new Error('Failed to fetch'))).toBe('unreachable');
    expect(classifyProbeFailure(null)).toBe('unreachable');
    expect(classifyProbeFailure(undefined)).toBe('unreachable');
  });

  it('does not treat an unauthenticated error as locked rules', () => {
    // A signed-out read that the rules reject is a different condition from the
    // database being on default deny, and the advice to the student differs.
    expect(classifyProbeFailure({ code: 'unauthenticated' })).toBe('unreachable');
  });
});
