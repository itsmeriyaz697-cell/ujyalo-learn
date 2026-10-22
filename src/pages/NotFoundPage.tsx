import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Sparkles } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" description="This page does not exist." path="/404" noindex />
      <div className="container-page flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
        <Logo size={44} withText={false} />
        <p className="mt-6 text-6xl font-extrabold tracking-tight" style={{ color: 'var(--primary)' }}>
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">This page is not here</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          The link may be broken, or the page may have moved. Everything else is still where you left it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button asChild icon={<ArrowLeft className="h-4 w-4" />}>
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="secondary" icon={<Sparkles className="h-4 w-4" />}>
            <Link to="/app/tutor">Ask the AI tutor</Link>
          </Button>
        </div>
        <div className="mt-8 flex items-center gap-2 text-xs text-muted">
          <Compass className="h-4 w-4" aria-hidden="true" />
          Try <Link className="underline" to="/subjects">Subjects</Link>,{' '}
          <Link className="underline" to="/features">Features</Link>, or{' '}
          <Link className="underline" to="/help">Help</Link>.
        </div>
      </div>
    </>
  );
}
