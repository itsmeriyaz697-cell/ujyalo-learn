import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, FileText, PencilLine, Sparkles, Wrench } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody } from '@/components/ui/Card';
import { InlineAlert } from '@/components/ui/Feedback';
import { AiStatusBanner } from '@/components/app/AiStatusBanner';
import { PageHeading } from '@/components/app/PageHeading';
import { useAiHealth } from '@/hooks/useAiHealth';
import { STUDY_TOOLS } from '@/config/curriculum';

const ICONS: Record<string, typeof FileText> = {
  'revision-summary': FileText,
  'formula-helper': Calculator,
  'writing-assistant': PencilLine,
  'question-explainer': Sparkles,
};

export default function ToolsPage() {
  const { health, loading, refresh } = useAiHealth();

  return (
    <>
      <Seo title="Study tools" description="AI study tools for revision, formulas, writing and questions." path="/app/tools" noindex />
      <PageHeading
        eyebrow="Tools"
        title="Study tools"
        description="Focused helpers for the moments when you need more than a chat: a revision sheet, a formula explanation, writing feedback or a question walkthrough."
        actions={
          <Link to="/app/tutor" className="btn btn-secondary btn-sm">
            Open AI tutor <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <AiStatusBanner health={health} loading={loading} onRetry={refresh} />

      <div className="grid gap-3 sm:grid-cols-2">
        {STUDY_TOOLS.map((tool) => {
          const Icon = ICONS[tool.id] ?? Wrench;
          return (
            <Link key={tool.id} to={tool.path} className="card card-hover flex flex-col p-5">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                {tool.label}
              </h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{tool.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                Open tool <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        <Card>
          <CardBody>
            <InlineAlert tone="info" title="Everything here is AI-generated">
              Study tools send the text you enter (and your grade/subject context) to the configured AI provider. Do not paste
              personal information. Check important facts against your textbook — especially formulas, definitions and exam
              advice.
            </InlineAlert>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
