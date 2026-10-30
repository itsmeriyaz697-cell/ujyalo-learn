/**
 * The opportunities directory.
 *
 * Rules this file exists to enforce:
 *
 *  1. Nothing is listed unless its official page was opened and the page
 *     confirmed the programme. Every entry therefore has a `lastVerified` date
 *     and an `officialUrl` pointing at the provider, never at an aggregator.
 *  2. A deadline is printed only when the provider publishes one we read.
 *     Otherwise `deadline` is null and the page says so, rather than guessing
 *     "usually in March".
 *  3. No affiliate links, no paid placements, no referral codes.
 *
 * To add a listing: open the official page, copy the real title and URL, write
 * the eligibility in your own words, set `lastVerified` to the date you looked.
 * `npm run check:opportunities` fails the build on a duplicate id, a missing
 * verification date, or a deadline already in the past without `expired: true`.
 */

export type OpportunityCategory =
  | 'Free courses'
  | 'Competition'
  | 'Scholarship'
  | 'Student programme'
  | 'Technology';

export interface Opportunity {
  id: string;
  title: string;
  provider: string;
  category: OpportunityCategory;
  /** One or two sentences, written plainly, no marketing. */
  summary: string;
  eligibility: string;
  /** Who can take part, geographically. */
  availability: string;
  /** ISO date (YYYY-MM-DD) only when the provider publishes one we have read. */
  deadline: string | null;
  /** Shown instead of a deadline when there is no fixed date. */
  deadlineNote: string;
  officialUrl: string;
  /** The date this listing was checked against the provider's own page. */
  lastVerified: string;
  cost: string;
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'mit-ocw',
    title: 'MIT OpenCourseWare',
    provider: 'Massachusetts Institute of Technology',
    category: 'Free courses',
    summary:
      'The actual course materials for thousands of MIT subjects — lecture notes, problem sets, exams and, for many courses, video lectures. Nothing is shortened or behind a paywall.',
    eligibility: 'Anyone. No application, no account, no minimum age.',
    availability: 'Online, worldwide',
    deadline: null,
    deadlineNote: 'Open all year — there is nothing to apply for.',
    officialUrl: 'https://ocw.mit.edu/',
    lastVerified: '2026-10-30',
    cost: 'Free',
  },
  {
    id: 'cs50x',
    title: 'CS50x — Introduction to Computer Science',
    provider: 'Harvard University',
    category: 'Free courses',
    summary:
      'Harvard’s introductory computer science course, redesigned for online study. Lectures, walkthroughs and graded problem sets covering C, Python, SQL and web programming.',
    eligibility:
      'Open enrolment. Strong Class 10 maths helps, but the first weeks start from zero.',
    availability: 'Online, worldwide',
    deadline: null,
    deadlineNote: 'Self-paced; a new edition opens each January.',
    officialUrl: 'https://cs50.harvard.edu/x/',
    lastVerified: '2026-10-30',
    cost: 'Free to study. The optional verified certificate is paid.',
  },
  {
    id: 'technovation-girls',
    title: 'Technovation Girls',
    provider: 'Technovation',
    category: 'Competition',
    summary:
      'Teams of girls build a mobile app or an AI project that solves a problem in their own community, then submit it for judging. Mentors are provided, and the programme runs in seasons.',
    eligibility: 'Girls and young women aged 8–18, working in teams with a mentor.',
    availability: 'Participating countries, including Nepal',
    deadline: null,
    deadlineNote: 'Season opening and submission dates are published on the programme site each year.',
    officialUrl: 'https://www.technovation.org/',
    lastVerified: '2026-10-30',
    cost: 'Free to enter',
  },
  {
    id: 'imo',
    title: 'International Mathematical Olympiad',
    provider: 'IMO Foundation',
    category: 'Competition',
    summary:
      'The oldest international science olympiad: six problems over two days, sat by national teams of six secondary-school students. Past papers and solutions are published openly.',
    eligibility:
      'Secondary-school students selected through their own country’s national olympiad. You cannot enter directly.',
    availability: 'International, through national selection',
    deadline: null,
    deadlineNote: 'Selection dates are set by each country’s olympiad body, not by the IMO.',
    officialUrl: 'https://www.imo-official.org/',
    lastVerified: '2026-10-30',
    cost: 'Free — but reaching the team means qualifying at home first',
  },
  {
    id: 'ioi',
    title: 'International Olympiad in Informatics',
    provider: 'IOI',
    category: 'Competition',
    summary:
      'Competitive programming for school students: algorithmic problems solved in C++, Java or Python over two contest days. The site publishes every past problem with test data.',
    eligibility: 'Secondary-school students, selected by their national contest.',
    availability: 'International, through national selection',
    deadline: null,
    deadlineNote: 'Each country runs its own qualifying rounds; the IOI site lists the annual schedule.',
    officialUrl: 'https://ioinformatics.org/',
    lastVerified: '2026-10-30',
    cost: 'Free',
  },
  {
    id: 'bebras',
    title: 'Bebras Computing Challenge',
    provider: 'Bebras',
    category: 'Competition',
    summary:
      'A short, puzzle-based challenge about computational thinking — no programming language required. Schools register and run the challenge in their own classrooms.',
    eligibility: 'School students from roughly age 8 upward, through a registering school.',
    availability: 'Many participating countries; check the site for your country',
    deadline: null,
    deadlineNote: 'The challenge window opens once a year in each participating country.',
    officialUrl: 'https://www.bebras.org/',
    lastVerified: '2026-10-30',
    cost: 'Free to take part in most countries',
  },
];

export const CATEGORIES: OpportunityCategory[] = [
  'Free courses',
  'Competition',
  'Scholarship',
  'Student programme',
  'Technology',
];

/** Today's date in Nepal, used so an expired listing is labelled, never hidden. */
export function todayInNepal(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isExpired(item: Opportunity, today = todayInNepal()): boolean {
  if (!item.deadline) return false;
  return item.deadline < today;
}

/** Long, readable form of an ISO date, e.g. "30 October 2026". */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}
