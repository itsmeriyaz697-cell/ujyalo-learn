# Admin panel — setup, roles and publishing

The admin panel lives at `/admin`. It manages the public **learning library**
(courses and resources), site settings and an audit log. It never opens student
conversations, notes or quiz attempts: those collections stay owner-only.

---

## 1. How access actually works

| Layer | What it does | Where it lives |
| --- | --- | --- |
| Route guard | Sends signed-out visitors to `/login?next=/admin`; shows “no admin role” for students | `src/pages/admin/AdminLayout.tsx` |
| Role lookup | Reads `roles/{uid}` once per session | `src/features/content/ContentProvider.tsx` |
| **Database rules** | **The real check.** Writes require `roles/{uid}.role in [owner, admin, editor]` | `firestore.rules` |
| UI affordances | Hide settings/roles from editors, disable publish while invalid | admin pages |

Hiding a button is not security, and it is not treated as such here. If someone
opens the browser console and writes to `courses` with a student account, the
rules reject it.

### Roles

| Role | Content (courses/resources) | Settings | Audit log | Roles |
| --- | --- | --- | --- | --- |
| `owner` | full | read/write | read | read/write |
| `admin` | full | read/write | read | — |
| `editor` | write, publish | — | append only | — |
| `student` | public content only | — | — | — |

---

## 2. Bootstrapping the first owner (no default password)

There is no seeded admin account and no setup route — a public setup URL is a
backdoor. Create the first owner once, by hand:

1. Create a normal account through `/signup` (this uses Firebase Auth).
2. In the Firebase console → **Firestore** → create a document:
   - Collection: `roles`
   - Document ID: **your Firebase Auth UID** (Authentication → Users → UID)
   - Field: `role` (string) = `owner`
3. Reload `/admin`. The header shows your email and “Owner”.

Everything after that is granted from the Firebase console or by the owner
editing `roles/{uid}`. Adding future UI for role changes is listed in
`docs/ROADMAP.md` as a follow-up; the data model and rules already support it.

> **Why manual for now?** An owner-only “invite” screen needs Cloud Functions
> (to write a role for someone who cannot yet write it themselves). Cloud
> Functions is a paid plan on Firebase; the brief says keep costs minimal, so
> the bootstrap is a documented two-minute console step instead of an
> unverifiable “coming soon” button.

---

## 3. Publishing workflow

```
draft ──publish──▶ published ──archive──▶ archived
  ▲                    │
  └──────unpublish─────┘
```

- **Drafts are invisible** on the public site, in search and in the sitemap.
  The public pages read only `status == 'published'`; the query is constrained
  so Firestore rules accept it for anonymous readers.
- **Publishing validates.** A course needs a 6+ character title, a valid slug, a
  20+ character summary, at least one session, and `gradeMin <= gradeMax`. A
  resource additionally needs a source and a licence — the Publish button stays
  disabled until they are filled in, and the rules reject the write regardless.
- **Deleting** asks for confirmation and is permanent. Prefer Archive: it keeps
  the record, the audit trail and any inbound links honest.
- **Slugs become URLs.** Changing a slug changes the public URL; there is no
  redirect history yet (see `docs/ROADMAP.md`).

### Files and uploads

Resource upload is **not enabled**. Files are linked by URL (`https://` only),
and the field is labelled accordingly. Wiring Firebase Storage needs:

1. A Storage bucket and the `storage.rules` file in this repo deployed.
2. Server-side file-type checks (magic bytes, not the browser's MIME string).

Until that exists, the UI says uploads are disabled rather than pretending a
fake upload succeeded. `docs/ROADMAP.md` tracks it.

---

## 4. SEO overrides

`/admin/seo` lists every public route with the title and description that ship
in the build (`shared/seo-pages.json`). An editor can override any of them
without a deploy:

- the override is stored in `seoPages/{path}` and applied at runtime by the
  `Seo` component, so the change is visible immediately in the browser;
- it is **not** in the prerendered HTML until the next deploy — the page says so
  plainly, because an editor should know the difference between “users see it”
  and “crawlers see it”;
- titles and descriptions are validated as plain text (no `<`, `>`, `{`, `}`
  and length-capped), so metadata cannot be used to inject script;
- social image overrides must be `https://`;
- “Reset to default” writes an empty override, which falls back to the shipped
  values rather than blanking the tag.

| Collection | Read | Write |
| --- | --- | --- |
| `seoPages/{path}` | anyone (the values are already public in the page) | admins only, length- and type-checked |

Course and guide pages do not need an override: their metadata is generated from
the course or resource title and summary you already edit.

---

## 5. What is stored where

| Collection | Contents | Read | Write |
| --- | --- | --- | --- |
| `courses/{id}` | course, lessons, status, slug | published: anyone; drafts: editors | editors; delete: admins |
| `resources/{id}` | resource body, source, licence | same | same |
| `settings/site` | site name, tagline, contact, maintenance banner | anyone | admins |
| `seoPages/{path}` | SEO overrides | anyone | admins |
| `roles/{uid}` | `{ role }` | own document only | owner |
| `auditLogs/{id}` | actor, action, entity, summary, timestamp | admins | append by editors, never edited or deleted |
| `users/{uid}/**` | student data | the student only | the student only |

The audit log records **no** student data, no message content and no tokens —
only who changed which piece of content, and when.

---

## 6. Deploying the rules

```bash
npm install --global firebase-tools   # once
firebase login
firebase use --add                    # choose your project
firebase deploy --only firestore:rules,firestore:indexes
```

The four composite indexes in `firestore.indexes.json` are required by the
library queries (`status + updatedAt`, `slug + status`). Firestore creates them
on deploy; a newly created index takes a few minutes to build.

---

## 7. Manually testing permissions (do this after any rules change)

Create three accounts (student, editor, owner), set the role documents, then run
these from the browser console while signed in as each:

```js
// 1. Student tries to publish content — must fail with permission-denied.
import('firebase/firestore').then(async ({ doc, setDoc }) => {
  const { db } = window.__ujyaloTest; // or use your own handle
  await setDoc(doc(db, 'courses', 'hacked'), { status: 'published', slug: 'hacked' });
});

// 2. Student reads a draft — must fail.
//    A direct getDoc on a draft course should be permission-denied.

// 3. Student reads another student's notes — must fail (path is uid-scoped).

// 4. Editor writes settings/site — must fail.

// 5. Editor appends to auditLogs — must succeed; editing one must fail.
```

| Check | Expected | Verified in this build |
| --- | --- | --- |
| Signed-out `/admin` → login with `?next=` | redirect | ✅ automated |
| Draft resource hidden from the public list and its direct URL | 404 page | ✅ automated |
| Publish blocked while the form is invalid | Publish disabled + reasons listed | ✅ automated |
| Publish → appears publicly, audit entry written | ✅ | ✅ automated |
| Delete → disappears publicly | ✅ | ✅ automated |
| Firestore rules enforced against a live project | — | ⚠️ **not tested**: no Firebase project is configured for this build |

The last row is the honest gap. Until `VITE_FIREBASE_*` exists, every rule above
is verified only by reading, and the app runs in the clearly-labelled demo mode
where admin changes live in one browser.
