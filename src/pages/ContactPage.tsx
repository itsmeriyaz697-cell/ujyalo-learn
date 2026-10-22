import { useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Copy, Mail, MessageSquareWarning } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';

const TOPICS = [
  { id: 'general', label: 'General question' },
  { id: 'report', label: 'Report incorrect or inappropriate AI content' },
  { id: 'bug', label: 'Report a technical problem' },
  { id: 'privacy', label: 'Privacy or data request' },
  { id: 'feedback', label: 'Feedback or subject request' },
];

const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL ?? '').trim();

export default function ContactPage() {
  const [params] = useSearchParams();
  const initialTopic = params.get('topic') === 'report' ? 'report' : 'general';
  const [topic, setTopic] = useState(initialTopic);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState(false);

  const body = useMemo(
    () => `Topic: ${TOPICS.find((t) => t.id === topic)?.label ?? topic}\nFrom: ${name || '(name not given)'} <${email || 'no email'}>\n\n${message}`,
    [topic, name, email, message],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!CONTACT_EMAIL) {
      setOpened(false);
      return;
    }
    const subject = encodeURIComponent(`[Ujyalo Learn] ${TOPICS.find((t) => t.id === topic)?.label ?? topic}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Seo
        title="Contact"
        description="Contact the Ujyalo Learn team with questions, feedback, privacy requests or reports of incorrect AI content."
        path="/contact"
      />

      <Section className="!pb-8">
        <SectionHeading
          as="h1"
          eyebrow="Contact"
          title="Get in touch"
          description="Questions, feedback, privacy requests and reports of incorrect AI content are all welcome."
        />
      </Section>

      <Section className="!py-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select label="What is this about?" value={topic} onChange={(event) => setTopic(event.target.value)}>
                {TOPICS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                <Input
                  label="Your email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  hint="So a reply can reach you."
                />
              </div>
              <Textarea
                label="Message"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                placeholder={
                  topic === 'report'
                    ? 'Describe what was wrong and which topic or question it was about. Please do not include personal information.'
                    : 'How can we help?'
                }
                hint="Do not include passwords, API keys, or another student’s information."
              />

              {CONTACT_EMAIL ? (
                <>
                  <Button type="submit" icon={<Mail className="h-4 w-4" />} disabled={!message.trim()}>
                    Open in email app
                  </Button>
                  <p className="text-[11px] leading-relaxed text-muted">
                    This form does not store messages on the server. It opens your email app with the message ready to send
                    to <strong>{CONTACT_EMAIL}</strong>.
                  </p>
                  {opened && (
                    <InlineAlert tone="success">
                      Your email app should now be open. If nothing happened, copy the message and send it manually.
                    </InlineAlert>
                  )}
                </>
              ) : (
                <>
                  <InlineAlert tone="warning" title="Contact address not configured">
                    The site owner has not set <code>VITE_CONTACT_EMAIL</code> yet, so this form cannot send email. You can
                    still copy your message and send it through whatever contact channel Ujyalo Learn publishes.
                  </InlineAlert>
                  <Button type="button" variant="secondary" onClick={copyMessage} icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                    {copied ? 'Copied' : 'Copy message'}
                  </Button>
                </>
              )}
            </form>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="h-4 w-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Reporting AI content
                </h2>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                AI can produce confident but wrong answers. If something is incorrect, inappropriate for your age, or
                presented as official curriculum when it is not, tell us which topic or question it involved. Do not paste
                personal information or full private conversations.
              </p>
              <Link to="/contact?topic=report" className="mt-3 inline-block text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                Report an answer →
              </Link>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Privacy and data requests
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                You can delete your account and data yourself in Settings. For other privacy requests, choose “Privacy or
                data request” above and tell us what you need.
              </p>
              <Link to="/privacy" className="mt-3 inline-block text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                Read the Privacy Policy →
              </Link>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                For parents and guardians
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                If your child uses Ujyalo Learn and you would like their account or data reviewed or deleted, contact us.
                Accounts use an email address and learning preferences only — no address, phone number or school records.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
