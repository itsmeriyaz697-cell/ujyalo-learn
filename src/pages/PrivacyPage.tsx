import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/marketing/LegalPage';
import { seoFor } from '@/config/seoPages';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      seoTitle={seoFor('/privacy').title}
      description={seoFor('/privacy').description}
      path="/privacy"
      updated="22 October 2026"
      intro={
        <>
          <p>
            Ujyalo Learn is a learning platform used by school students, including children. This policy explains, in plain
            language, what we collect, why we collect it, how it is protected, and how you can delete it. It applies to the
            Ujyalo Learn web application and its AI tutoring, quiz, notes, flashcard, planner and progress features.
          </p>
          <p>
            If you are a parent or guardian, the short version: we ask for a student’s email address, a display name and
            learning preferences. We do not ask for a home address, phone number, school ID, photograph or date of birth.
            Students can delete their own data at any time.
          </p>
        </>
      }
      sections={[
        {
          heading: 'Who is responsible for your data',
          body: (
            <>
              <p>
                Ujyalo Learn is an independent education project founded and created by <strong>Riyaz Chalise</strong>. For
                privacy questions or requests, use the <Link to="/contact">Contact page</Link> and select “Privacy or data
                request”.
              </p>
              <p>
                The platform is operated by the site owner on infrastructure chosen by that owner (for example Vercel for
                hosting and Google Firebase for authentication and database services). Where the deployment is run by a
                school or another organisation, that organisation may be the data controller for its students.
              </p>
            </>
          ),
        },
        {
          heading: 'What we collect',
          body: (
            <>
              <ul>
                <li>
                  <strong>Account information:</strong> email address, display name, sign-in provider (email/password or
                  Google), and an internal user ID.
                </li>
                <li>
                  <strong>Learning preferences:</strong> grade, curriculum context, preferred language, selected subjects,
                  learning goals, explanation style and daily study time.
                </li>
                <li>
                  <strong>Learning records you create:</strong> AI tutoring conversations, notes, quizzes you generate, quiz
                  attempts and scores, flashcard decks, study goals and tasks, and activity events used for your streak and
                  progress charts.
                </li>
                <li>
                  <strong>Technical information:</strong> the minimum needed to operate securely, such as error logs without
                  conversation content, approximate request counts for rate limiting, and standard server logs held by the
                  hosting provider.
                </li>
              </ul>
              <p>
                We do <strong>not</strong> ask for your home address, phone number, school identification number, national ID,
                photograph, precise location or payment details. We do not run advertising trackers or sell data.
              </p>
            </>
          ),
        },
        {
          heading: 'Why we process it',
          body: (
            <>
              <ul>
                <li>To create and secure your account and keep you signed in.</li>
                <li>To personalise explanations to your grade, curriculum, language and subjects.</li>
                <li>To save your notes, quizzes, plans and progress so you can return to them.</li>
                <li>To keep the service safe and affordable — including rate limiting and abuse prevention.</li>
                <li>To respond to support, privacy and content-report requests.</li>
              </ul>
              <p>
                Where a legal basis is required, processing is based on the performance of the service you requested, your
                consent (for optional features), and the legitimate interest of operating a safe educational service.
              </p>
            </>
          ),
        },
        {
          heading: 'AI processing — important',
          body: (
            <>
              <p>
                When you send a question, generate a quiz or use a study tool, the text you submit — together with your
                learning preferences — is sent to the AI provider configured by the site owner so that a response can be
                generated. That provider processes the request under its own terms and privacy policy.
              </p>
              <p>
                The platform never exposes the provider’s API key to your browser. AI processing is only active when the site
                owner has configured a provider. If the owner later changes providers, the same categories of data may be
                processed by a different AI service.
              </p>
              <p>
                <strong>Do not include personal or sensitive information</strong> in questions, notes or quiz topics. There
                is no need for the tutor to know your address, phone number, school, or any other identifying detail.
              </p>
            </>
          ),
        },
        {
          heading: 'Children and parental consent',
          body: (
            <>
              <p>
                Ujyalo Learn is designed for school students. We collect the minimum information needed and avoid features
                that encourage sharing personal details.
              </p>
              <p>
                If local law requires parental consent for children under a certain age (for example under 13 or under 16
                depending on the jurisdiction), a parent or guardian must create or approve the account. During sign-up the
                student confirms that a parent or guardian has agreed when they are below the applicable age.
              </p>
              <p>
                Parents and guardians may contact us to review, correct or delete a child’s account and data. Deleting the
                account removes the profile and learning records.
              </p>
            </>
          ),
        },
        {
          heading: 'Where data is stored and who can access it',
          body: (
            <>
              <p>
                Account data is stored in the Firebase project configured by the site owner. Learning records are stored with
                an owner identifier, and Firestore security rules restrict reading and writing to the signed-in owner of
                that data. Hiding buttons in the interface is never the only protection.
              </p>
              <p>
                Administrators do not browse student conversations by default. Aggregate or diagnostic information (such as
                whether the AI provider is configured, or how many requests a deployment has served) may be reviewed to
                operate the service. Access to infrastructure is limited to the site owner and the service providers they
                use (for example hosting and database providers).
              </p>
              <p>
                If the deployment is in <strong>local demo mode</strong> (Firebase not configured), everything you create is
                stored only in that browser and is never uploaded. It is not secure and is not synced between devices.
              </p>
            </>
          ),
        },
        {
          heading: 'How long we keep data',
          body: (
            <>
              <p>
                Your learning records are kept while your account exists, because that is the point of the service. You can
                delete individual conversations, notes, quizzes and decks at any time, and you can delete your whole account
                and data from Settings.
              </p>
              <p>
                When you delete your account, the platform deletes your profile and learning records and then removes the
                sign-in account. Backup copies held by infrastructure providers may persist for a short, limited period
                under their standard retention policies.
              </p>
            </>
          ),
        },
        {
          heading: 'Your rights and choices',
          body: (
            <>
              <p>
                Depending on where you live, you may have rights to access, correct, export or delete your personal data, and
                to object to certain processing. You can exercise most of these directly:
              </p>
              <ul>
                <li>Edit your preferences and notes in the app.</li>
                <li>Export a copy of your data from Settings.</li>
                <li>Delete individual records or your entire account from Settings.</li>
              </ul>
              <p>
                For anything else, contact us through the <Link to="/contact">Contact page</Link>. We may need to verify that
                you are the account holder or the parent/guardian of a child account before acting on a request.
              </p>
            </>
          ),
        },
        {
          heading: 'Security',
          body: (
            <>
              <p>
                We use:
              </p>
              <ul>
                <li>Firebase Authentication for sign-in, with sessions managed by Firebase.</li>
                <li>Firestore security rules that require authentication and restrict records to their owner.</li>
                <li>A server-side AI endpoint so provider API keys are never shipped to the browser.</li>
                <li>Request size limits, rate limits and restricted provider destinations to reduce abuse.</li>
              </ul>
              <p>
                No service can be perfectly secure. If you believe your account has been compromised, change your password
                (or reset it) and contact us. In demo mode, there is no server-side security at all — anyone with access to
                the browser profile can read the local data, so do not use demo mode for anything sensitive.
              </p>
            </>
          ),
        },
        {
          heading: 'Cookies and local storage',
          body: (
            <>
              <p>
                Ujyalo Learn does not use advertising cookies. The app uses browser storage for essential purposes: keeping
                you signed in (Firebase), remembering your theme preference, and — in demo mode — storing your local
                account and learning data. A service worker caches static files so the interface can load on unreliable
                connections; it does not cache AI conversations or private records.
              </p>
              <p>
                Clearing your browser storage removes local preferences and any demo-mode data, and signs you out.
              </p>
            </>
          ),
        },
        {
          heading: 'Changes to this policy',
          body: (
            <>
              <p>
                If this policy changes materially, the “last updated” date will change and the update will be described in
                the app. Continued use after an update means you accept the revised policy. Where required, we will ask for
                consent again.
              </p>
            </>
          ),
        },
        {
          heading: 'Contact',
          body: (
            <>
              <p>
                Privacy questions and data requests: <Link to="/contact">Contact page</Link> → “Privacy or data request”. For
                content reports, choose “Report incorrect or inappropriate AI content”.
              </p>
              <p>
                This policy is a plain-language description of current practice. It is not legal advice, and the site owner
                is responsible for ensuring the deployment complies with the law that applies to their students.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
