import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
  /** Set while streaming to avoid heavy re-renders of unstable Markdown. */
  streaming?: boolean;
}

/**
 * Renders tutor output: GitHub-flavoured Markdown (tables, lists, code) and
 * LaTeX maths via KaTeX. No raw HTML is allowed, which prevents injection.
 */
function MarkdownImpl({ content, className }: MarkdownProps) {
  return (
    <div className={cn('prose-ujyalo', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <div className="my-3 overflow-x-auto scroll-thin">
              <table {...props}>{children}</table>
            </div>
          ),
          code: ({ className: codeClass, children, ...props }) => (
            <code className={codeClass} {...props}>
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownImpl, (prev, next) => prev.content === next.content && prev.className === next.className);
