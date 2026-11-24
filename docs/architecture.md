# Production architecture and rollout

This is a generic design description, not a production export. The public workflow uses embedded fictional observations. A real rollout requires authorized accounts, site configuration, quotas, credentials and acceptance tests.

| Component | Suggested cadence | Operational role |
|---|---|---|
| Crawl | Daily key pages; weekly full sitemap | HTTP, redirects, internal links, canonical, noindex, metadata, structured data, baseline integrity |
| Search Console | Daily sampled inspection | Indexed-version coverage, canonical and index status; budget and retry calls |
| Page experience | Daily mobile sampling | Field metrics where available; lab diagnostics for hypotheses, separate from field results |
| Uptime / TLS | 15 min / daily | Availability and renewal warnings from a documented vantage point |
| Issue and task sync | 15 min | Upsert by stable issue identity and preserve human-managed columns |
| Notification | New/reopened incidents; weekly digest | Concise HTML, top actions, link to task tracker, log accepted sends |
| Run health | Daily and execution failure event | Coverage, freshness, errors, persistence write counts, escalation |

## Adapters for an authorized deployment

- HTTP Request nodes: fetch sitemap and robots, crawl bounded same-origin URLs; limit requests, retry transient errors, capture status/Location. Prefer a robust parser; test nested sitemaps, CDATA, redirects and malformed markup.
- Search Console URL Inspection API: use read-only OAuth and verified property, select key pages plus rotating samples. Confirm current quotas in official documentation. Inspect the indexed version, not a live test.
- PageSpeed Insights and CrUX: use a scoped API key; store URL field data separately from lab or origin-level results. Handle missing field data and API changes.
- Sheets: restricted team workbook; keep machine state, history and editable task fields separate. Use stable task keys and protect system columns. Avoid simultaneous physical row sorts and writes.
- Gmail: send from a verified work account only, with named recipients. Log successful accepted sends, handle send/log failure windows, and avoid duplicate deliveries on retry.
- Dashboard: chart latest dated snapshots, coverage, open priorities and verified resolutions; exclude invalidated QA rows. Do not sum scores across dates.

## Acceptance checklist

Confirm access and read-only site scope; sample valid and intentionally bad URLs; test unavailable metrics and transient failures; check idempotency; verify actual mailbox delivery and task persistence; validate that human edits survive updates; verify a fixed issue only after a new observation; check schedule and timezone; record time savings. Avoid changing website routes until the site owner approves the target.

The production design supports independent monitors and a shared task ledger. The public demo intentionally runs one contained scenario without accounts or network access. Production scheduling and connector delivery must be demonstrated in an authorized environment; the public repo does not expose those private systems.
