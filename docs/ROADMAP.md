# Roadmap and known gaps

Everything below is **not built yet**. It is listed here so nothing on the site
pretends otherwise.

## Content and publishing

| Item | State | What it needs |
| --- | --- | --- |
| File uploads (PDF, images) for resources | Not built — the form links a URL instead and says uploads are disabled | Firebase Storage bucket + `storage.rules` + server-side magic-byte checks |
| Malware scanning of uploads | Not available | A scanning service; until then we must not call uploads “scanned” |
| Role-management screen (invite an editor from the UI) | Not built — roles are set in the Firebase console | Cloud Functions (paid Blaze plan) to write a role for a user who cannot write it themselves |
| Redirects for changed slugs | Not built | A `redirects` collection + a function or edge middleware |
| Scheduled publishing | Not built | Cloud Functions or a cron job |
| Revision history / undo for edits | Not built — the audit log records that an edit happened, not its content | Store versions in a subcollection |
| Course thumbnails and cover images | Not built | Storage (same blocker as uploads) |
| Nepali translations of the UI | Not built — the tutor can answer in Nepali, the interface is English | i18n layer (`react-i18next`) and translated copy |

## Analytics and growth

| Item | State |
| --- | --- |
| Privacy-friendly analytics | Not installed. No tracking script, no cookies. Add a tool only with consent handling. |
| Search-console verification | Owner action: docs/SEO.md walks through Google and Bing. |
| Sitemap submission | Owner action, same document. |

## Student features from the brief that are out of scope for now

| Item | Why |
| --- | --- |
| Payments / subscriptions | No payment provider, no legal entity, no refund policy. Pricing page lists plans as *planned*. |
| Parent accounts | Needs a separate data model and consent design. |
| Public leaderboards | Deliberately not built: it would expose children's names and performance. |
| Notifications / reminders | No notification service configured; the planner says so on the page. |
| Video lessons | No hosting or bandwidth budget; the capability strip does not claim video. |

## Quality

| Item | State |
| --- | --- |
| Screen-reader pass with NVDA and VoiceOver | Not done. Keyboard and ARIA are tested in Chromium only. |
| Load testing | Not done. Rate limits are per-instance and in memory. |
| Backup restore drill | Documented in docs/BACKUP.md, not yet performed against a real project. |
