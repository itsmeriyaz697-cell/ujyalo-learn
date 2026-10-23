# Getting to 1,000 daily users

An honest plan, not a promise. The number is achievable for a Nepal exam-prep
product, but it is a distribution problem measured in months, and it is highly
seasonal. Anyone who quotes you a figure without assumptions is guessing.

**State of the product today (verified):**

- 41 public pages: 7 courses, 6 guides, 12 grade pages, plus the marketing set.
- No analytics of any kind. Nothing about traffic is measurable yet.
- Accounts are still browser-only in production — the Firestore rules were never
  published, so the database denies every read. **Fix this before spending a
  rupee or an hour on traffic.** Sending students to a signup that fails is worse
  than sending none.

---

## 1. What 1,000/day actually requires

| Assumption | Value | Why |
| --- | --- | --- |
| Daily-use habit in exam season | 20–30% DAU/MAU | study tools are habitually used, not daily by everyone |
| Monthly actives needed | **3,000–5,000** | at 25% |
| Alternative, weaker habit | 10% DAU/MAU → 10,000 MAU | if usage is weekly rather than daily |
| Signup rate from visit | 15–25% | realistic for a free tool with no payment step |
| Week-4 retention | 25–35% | the number that decides everything |

So: roughly **15,000–25,000 visits a day** at the top of the funnel to hold
1,000 daily actives. Visits are the easy half. Retention is the product.

**Seasonality is not optional to plan for.** SEE and NEB exams cluster in
Feb–May. Expect a spike then and a trough in the monsoon. A realistic year:

```
Feb–May   800–1,500/day      exam season, all channels
Jun–Aug   100–250/day        trough — the honest test of retention
Sep–Nov   300–600/day        new session starts, content fatigue resets
Dec–Jan   500–1,000/day      revision season begins
```

Plan cash and effort around that shape. The monsoon number is the true measure
of the product; the exam number measures the calendar.

---

## 2. Channels, ranked by what actually works in Nepal

### A. Exam-query search — highest ceiling, slowest
Students search in a mix of English and Nepali, and the queries are extremely
specific: *SEE science chapter 5 notes*, *NEB grade 11 physics past paper*,
*class 10 maths solution Nepal*, *SEE 2082 routine*.

Thirteen content pages will not rank for those. This needs volume: one page per
chapter per subject, one per past paper, with real worked solutions. Roughly
**300–500 pages** before search becomes a serious channel, and 6–9 months before
it compounds.

Hard rule: these must be genuinely useful and attributed. Mass-generated pages
are exactly what Google's spam policies target, and the downside is losing what
little ranking the site has.

### B. WhatsApp and Facebook groups — cheapest, fastest
Nepali students organise in group chats and Facebook groups around exams. This
is where a share loop pays off immediately.

What makes it spread is a *reason to send a link*, not a share button:

- **Challenge a classmate** — "I scored 7/10 on SEE Science. Beat it." The link
  carries a subject and a score, never a name or a uid. The visitor takes the
  same quiz; their score is compared locally. No student data leaves the device.
- **Streak card** — "14 days of study in a row", as an image.
- **Useful artefact** — the four-week revision plan as a printable one-pager.

Rule: nothing shareable may contain an email, a name or a uid. A share loop that
leaks a child's data is not a growth channel, it is a liability.

### C. Teachers and schools — best return per hour, entirely offline
One teacher brings 40–100 students. **Twenty teachers is 1,000/day more reliably
than any SEO strategy**, and it costs a conversation rather than six months.

What it needs from the product: class codes, a teacher view of aggregate
progress only (never individual chats), and a printable join sheet. What it
needs from you: going to schools and talking to teachers. It is also the slowest
thing to fake and the fastest to lose — one bad experience with a class of 40
ends that school.

### D. TikTok and Shorts — real, but a content habit
A 60-second "solve this SEE maths question" clip funnels warm traffic. Effective
because the viewer has just seen the product work. It requires posting
consistently — 3–5 a week for months. That is your time, not a build.

### E. Past-paper tools — seasonal spikes
Routine, syllabus, results-check and paper-solution pages spike hard in Jan–April
and drop to near zero after. Build them for the season, do not plan the business
on them.

---

## 3. What not to do

- **Buy traffic.** It converts at near zero, and it corrupts the only numbers you
  have to make decisions with.
- **Fake testimonials, user counts or success rates.** One student who checks is
  a permanent credibility loss, and the honesty constraint on this project is the
  product's main differentiator.
- **Mass AI pages to fill the sitemap.** Against Google's spam policy and
  directly risks the pages that do rank.
- **Promise AI-search visibility.** Nobody controls whether ChatGPT or Gemini
  cites a site. Clean structure and real answers help; guarantees are fiction.

---

## 4. First 90 days, week by week

| Weeks | Focus | Done when |
| --- | --- | --- |
| 1 | Publish the Firestore rules; seed the library; install analytics; confirm a real signup works end to end on production | a new account persists across devices |
| 2–3 | Share loop: challenge links, streak card, printable revision plan | a link shared in WhatsApp renders a proper preview card |
| 3–6 | Content volume: one page per chapter for the 3 highest-demand subjects (Science, Maths, English at SEE level) | 60–90 real pages, each with worked answers |
| 6–10 | Teacher kit: class codes, teacher view, join sheet; visit 10 schools | 3 teachers using it in a real class |
| 8–12 | Exam-season content: past papers, routines, solutions; TikTok/Shorts 3× weekly | 25+ videos, 200+ pages live |
| 12 | Review with real numbers | you know your retention rate and cost per active user |

The sequencing matters: measurement first (or you cannot tell which channel
worked), share loop second (it compounds), content third (it is slow), teachers
fourth (it is the most reliable but needs you present).

---

## 5. Metrics that decide the answer

Track only these six at first. More is noise.

1. **Visits by source** — which channel is actually sending people.
2. **Signup rate** — visits vs accounts created.
3. **Day-1 and week-4 retention** — the single most important number.
4. **Daily actives** — the goal itself.
5. **Quiz/tutor uses per active user** — whether the product is used or merely opened.
6. **Cost per active user** — for paid experiments only.

If week-4 retention is under 20%, more traffic is pouring water into a bucket
with a hole in it. Fix the product before buying distribution.

---

## 6. What I can build, and what only you can do

**I can build:** cookieless analytics (no cookie banner needed), challenge/share
links with proper preview cards, printable revision sheets, programmatic
chapter and past-paper pages from a content model, referral tracking, class
codes and a teacher view that shows aggregates only.

**Only you can do:** write or verify the curriculum content, talk to teachers,
post videos, and decide whether to spend money on ads. No amount of code
substitutes for those.

**The single highest-leverage hour this week** is not growth at all: publish the
rules, seed the library, and confirm one real account survives a device change.
Everything downstream is wasted until that works.
