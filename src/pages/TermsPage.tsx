import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/marketing/LegalPage';
import { seoFor } from '@/config/seoPages';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      seoTitle={seoFor('/terms').title}
      description={seoFor('/terms').description}
      path="/terms"
      updated="22 October 2026"
      intro={
        <>
          <p>
            These Terms of Service (“Terms”) govern your use of Ujyalo Learn, an AI-powered learning platform. By creating
            an account or using the service, you agree to these Terms. If you do not agree, please do not use the platform.
          </p>
          <p>
            If you are under the age of majority where you live, a parent or guardian must agree to these Terms for you.
            Ujyalo Learn is founded and created by <strong>Riyaz Chalise</strong>.
          </p>
        </>
      }
      sections={[
        {
          heading: 'What Ujyalo Learn is',
          body: (
            <>
              <p>
                Ujyalo Learn provides AI-generated explanations, practice quizzes, notes, flashcards, study planning and
                progress tools for students. It is an independent learning aid — not a school, examination board, textbook
                publisher or official curriculum provider.
              </p>
            </>
          ),
        },
        {
          heading: 'AI limitations — please read',
          body: (
            <>
              <p>
                AI-generated content can be incomplete, outdated or simply wrong, even when it sounds confident.
              </p>
              <ul>
                <li>Always verify important facts against your textbook, teacher or official curriculum documents.</li>
                <li>Do not rely on AI output for safety-critical decisions, medical advice or legal advice.</li>
                <li>Quizzes are practice material, not official examination questions.</li>
                <li>Ujyalo Learn never claims that an AI answer is approved by an examination board.</li>
              </ul>
              <p>
                We do not guarantee any particular grade, score, examination result or learning outcome.
              </p>
            </>
          ),
        },
        {
          heading: 'Your account',
          body: (
            <>
              <ul>
                <li>Provide an email address you control and a name you are comfortable being greeted by.</li>
                <li>Keep your password secure and do not share your account.</li>
                <li>You are responsible for activity that happens under your account.</li>
                <li>Provide accurate information and keep it reasonably up to date.</li>
                <li>Tell us promptly if you believe your account has been accessed without permission.</li>
              </ul>
              <p>
                Local demo accounts exist only in a browser and are not secure. Do not use demo mode for personal or
                sensitive information, and do not rely on it to keep your work.
              </p>
            </>
          ),
        },
        {
          heading: 'Acceptable use',
          body: (
            <>
              <p>You agree not to:</p>
              <ul>
                <li>Use the service to harass, threaten or harm another person, or to produce sexual content involving minors.</li>
                <li>Attempt to access another student’s account, data or conversations.</li>
                <li>Bypass usage limits, probe the API for vulnerabilities, or interfere with the service’s operation.</li>
                <li>Use automated tools to scrape or bulk-generate content, or resell access without permission.</li>
                <li>Upload malware, attempt server-side request forgery, or misuse the AI endpoint.</li>
                <li>Break the law or infringe the rights of others.</li>
              </ul>
              <p>
                We may suspend or remove access when we reasonably believe an account is being used to harm others, break
                these Terms, or create a security risk.
              </p>
            </>
          ),
        },
        {
          heading: 'Academic honesty',
          body: (
            <>
              <p>
                Ujyalo Learn is designed to help you understand. If your school’s rules do not allow AI assistance for a
                particular assignment or examination, follow those rules. Copying AI output as your own work without
                understanding it usually harms your learning and may breach your school’s academic honesty policy.
              </p>
            </>
          ),
        },
        {
          heading: 'Usage limits and availability',
          body: (
            <>
              <p>
                AI features are rate-limited to keep the service affordable. Limits are configurable by the site owner and
                are shown in the app. Limits may change.
              </p>
              <p>
                The service is provided on an “as available” basis. It may be unavailable during maintenance, provider
                outages, or network problems. We do not promise uninterrupted access or that AI features work offline.
              </p>
            </>
          ),
        },
        {
          heading: 'Pricing and payments',
          body: (
            <>
              <p>
                The core experience is free, with fair-use AI limits. Any paid tiers described on the Pricing page are
                planned features and are clearly labelled as unavailable. No payment is collected through the platform at
                the time these Terms were last updated. If payments are introduced, the price, billing terms and
                cancellation policy will be shown before purchase, and these Terms will be updated.
              </p>
            </>
          ),
        },
        {
          heading: 'Your content',
          body: (
            <>
              <p>
                You keep ownership of the questions, notes, essays and other content you create. You give the site owner the
                limited permission needed to store and process that content to provide the service — for example, sending a
                question to the AI provider to generate an answer.
              </p>
              <p>
                AI-generated explanations are produced for you, but similar output may be produced for other students. Do
                not present AI-generated content as an official curriculum document.
              </p>
            </>
          ),
        },
        {
          heading: 'Our content and branding',
          body: (
            <>
              <p>
                The Ujyalo Learn name, logo, interface and original written material are owned by the platform’s founder.
                You may not copy, redistribute or rebrand them without permission. Third-party libraries are used under
                their respective licences.
              </p>
            </>
          ),
        },
        {
          heading: 'Termination and deletion',
          body: (
            <>
              <p>
                You may delete your account at any time from Settings. We may suspend or terminate access for serious or
                repeated breaches of these Terms, or where required by law. Where practical, we will explain the reason.
              </p>
            </>
          ),
        },
        {
          heading: 'Disclaimers and liability',
          body: (
            <>
              <p>
                To the fullest extent permitted by law, the service is provided without warranties of any kind, express or
                implied, including fitness for a particular purpose and accuracy of AI output. Nothing in these Terms limits
                rights you have under mandatory consumer protection law.
              </p>
              <p>
                To the extent permitted by law, the site owner is not liable for indirect or consequential loss, lost grades,
                examination outcomes, or loss of data caused by clearing browser storage in demo mode. You are responsible
                for keeping your own copies of important notes.
              </p>
            </>
          ),
        },
        {
          heading: 'Changes to these Terms',
          body: (
            <>
              <p>
                We may update these Terms as the service develops. The “last updated” date will change, and significant
                changes will be described in the app. Continued use after an update means you accept the revised Terms.
              </p>
            </>
          ),
        },
        {
          heading: 'Contact',
          body: (
            <>
              <p>
                Questions about these Terms? Use the <Link to="/contact">Contact page</Link>. For privacy and data
                requests, read the <Link to="/privacy">Privacy Policy</Link>.
              </p>
              <p>
                These Terms are a plain-language description of how the service is operated. They are not legal advice; the
                site owner is responsible for ensuring the deployment meets the legal requirements that apply to their
                students.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
