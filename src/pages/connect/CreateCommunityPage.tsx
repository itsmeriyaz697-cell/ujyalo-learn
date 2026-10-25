import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Seo } from '@/components/seo/Seo';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { createCommunity, getCommunityBySlug } from '@/features/connect/firestore';

/** Turning a name into a URL segment, with the same rules the Firestore rule enforces. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
}

export default function CreateCommunityPage() {
  const { user, isBrowserGuest } = useAuth();
  const navigate = useNavigate();
  const connected = Boolean(user && !isBrowserGuest);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!connected) {
    return (
      <main id="main" className="container-page py-16">
        <Seo title="Create a community | Ujyalo Connect" description="Create a study community." path="/connect/new" noindex />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Creating a community needs a Discord account
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--text-soft)' }}>
          A community has an owner, and an owner has to be a real, persistent identity — otherwise nobody can moderate
          it. Reading and joining communities does not need this.
        </p>
        <Button asChild className="mt-5">
          <Link to="/connect/auth">Continue with Discord</Link>
        </Button>
      </main>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setError(null);
    const finalSlug = slug || slugify(name);
    if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(finalSlug)) {
      setError('The web address must be 3–40 characters: lowercase letters, numbers and single dashes.');
      return;
    }
    setBusy(true);
    try {
      const existing = await getCommunityBySlug(finalSlug);
      if (existing) {
        setError('That web address is already taken. Try another.');
        return;
      }
      await createCommunity({ name: name.trim(), slug: finalSlug, description: description.trim(), uid: user.uid });
      navigate(`/connect/c/${finalSlug}`, { replace: true });
    } catch (caught) {
      setError((caught as Error).message || 'The community could not be created.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo title="Create a community | Ujyalo Connect" description="Create a study community on Ujyalo Connect." path="/connect/new" noindex />
      <Section className="!py-10">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Create a community
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--text-soft)' }}>
          A place for one group: your class, your subject, or the exam you are sitting this year. You will be its owner
          and its first member, and a #general channel is created for you.
        </p>

        <form onSubmit={submit} className="mt-6 max-w-lg space-y-4">
          <label className="block">
            <span className="label">Name</span>
            <input
              className="input"
              value={name}
              maxLength={60}
              required
              placeholder="SEE 2026 — Science"
              onChange={(event) => {
                setName(event.target.value);
                if (!slug) setSlug(slugify(event.target.value));
              }}
            />
          </label>
          <label className="block">
            <span className="label">Web address</span>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted">/connect/c/</span>
              <input
                className="input"
                value={slug}
                maxLength={40}
                required
                placeholder="see-2026-science"
                onChange={(event) => setSlug(slugify(event.target.value))}
              />
            </div>
          </label>
          <label className="block">
            <span className="label">What is it for?</span>
            <textarea
              className="input min-h-[90px]"
              value={description}
              maxLength={400}
              placeholder="Who should join, and what gets discussed here."
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }} role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={!name.trim()}>
              Create community
            </Button>
            <Button asChild variant="secondary">
              <Link to="/connect">Cancel</Link>
            </Button>
          </div>
        </form>
      </Section>
    </>
  );
}
