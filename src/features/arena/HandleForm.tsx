import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { claimHandle } from './api';

/**
 * Choosing an Arena username.
 *
 * Two fields, deliberately. No email, no date of birth, no school — nothing
 * that would appear on a public profile. The country is here rather than in the
 * general profile because it only exists to power the Nepal board.
 */
export function HandleForm({
  countries,
  onDone,
  initialHandle = '',
  initialCountry = 'NP',
}: {
  countries: Array<{ code: string; name: string; flag: string }>;
  onDone: () => void;
  initialHandle?: string;
  initialCountry?: string;
}) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [handle, setHandle] = useState(initialHandle);
  const [country, setCountry] = useState(initialCountry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      await claimHandle(handle, country, token);
      toast('Your username is set. Play a quiz to appear on the board.', 'success');
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr_auto] sm:items-end" onSubmit={submit}>
      <Input
        label="Username"
        value={handle}
        onChange={(event) => setHandle(event.target.value)}
        placeholder="e.g. bright-falcon"
        autoComplete="off"
        spellCheck={false}
        maxLength={20}
        hint="3–20 characters: letters, numbers, hyphens or underscores."
      />
      <div>
        <label className="label" htmlFor="arena-country">
          Country
        </label>
        <select
          id="arena-country"
          className="input"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        >
          {countries.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        <p className="hint">This decides whether you show on the Nepal leaderboard.</p>
      </div>
      <Button type="submit" loading={saving} className="sm:mb-6">
        Save username
      </Button>
      {error && (
        <p className="field-error sm:col-span-3" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
