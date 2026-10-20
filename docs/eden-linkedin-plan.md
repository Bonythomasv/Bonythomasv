# Eden → LinkedIn: Plan

Goal: put Eden (BonyOS, the second brain) at a private `bonythomas.ca/eden`, then use it to
suggest LinkedIn post topics every Tuesday and Friday evening. Bony approves every post before it
goes out.

```
BonyOS Markdown (Mac, never committed)
        │  scripts/ build + validate
        ▼
versioned private snapshot ──► Cloudflare R2 (private)
                                     │
                    Cloudflare Worker (bonythomas.ca)
              ┌──────────────┼────────────────────┐
         /eden reader   WorkOS Google auth   cron: Tue + Fri ~6pm PT
         (Bony only)    (Bony only)          3 topics → Slack/email
                                                   │ Bony picks + approves
                                                   ▼
                                           LinkedIn Posts API
```

## Where things live

| Piece | Location | State |
|---|---|---|
| Reader code | `Bonythomasv/bonythomas.ca`, local checkout `~/Documents/code/bonythomas` | `/eden` work is uncommitted; only on Bony's Mac |
| Worker | `worker/index.js` (reader, document and search routes), `worker/auth.js` (preview and WorkOS) | built locally |
| UI | `dist/eden-app.js`, `dist/eden-app.css` | built locally |
| Snapshot tooling | `scripts/` | last snapshot had 172 docs; corpus now has 195 |
| Architecture and gates | `docs/eden-plan.md` (in that repo) | source of truth for Phase 1 |
| Corpus | `~/Documents/BonyOS` (start at `Home.md`) | private; never goes in Git or public assets |

Verified on 2026-10-20 (reported from the Mac): `npm test` passes 5/5, and `npm run eden:check`
finds no corpus in `dist/`. Not verified yet: any live `/eden` deployment or real WorkOS login.

## Phase 1: Eden live (now)

1. **Unblock the build.** Validation fails on two links to missing Codex memory summaries.
   Repoint each one if the summary exists elsewhere. Otherwise mark it explicitly *unavailable*,
   keeping the original target and the reason, and have the validator and reader accept that
   marker. Never delete links silently. Rebuild (expect about 195 docs, explain any gap) and re-run
   `npm test` and `npm run eden:check`.
2. **Push the code, never the corpus.** Confirm that `.gitignore` and `eden:check` exclude every
   corpus file and snapshot, then push `worker/`, `scripts/`, `dist/` UI, docs and tests to a
   feature branch. From that point cloud sessions can help with everything except building the
   snapshot.
3. **Release gates.** Each one needs evidence before anything is deployed:
   - [ ] Reviewable list of notes the reader will show, driven by an explicit allow/exclude rule
   - [ ] Dedicated WorkOS app: Google sign-in, authorized for Bony only
   - [ ] Private Cloudflare R2 bucket for snapshots (no public access)
   - [ ] Signed-out **and** wrong-user denial on every route (reader, document, search, assets)
         and every host (workers.dev, bonythomas.ca), as automated tests
4. **Deploy** `/eden` on bonythomas.ca, only after Bony signs off on the gates.

## Phase 2: LinkedIn connection

- LinkedIn developer app with two products: *Sign In with LinkedIn using OpenID Connect* (`openid profile`,
  gives the member ID) and *Share on LinkedIn* (`w_member_social`).
- OAuth callback lives in the existing Worker, behind the same WorkOS gate. The token is stored
  encrypted (Worker secret or KV).
- Posts go to `POST /rest/posts` with `author: urn:li:person:{id}`.
- Member tokens last about 60 days and usually come without a refresh token. Plan for an expiry
  check that sends a reminder about 7 days out, plus a one-click re-auth link.

## Phase 3: Tuesday and Friday topic suggestions

- Worker Cron Trigger, Tue and Fri around 18:00 America/Vancouver. Cron runs in UTC, so schedule
  both offsets or check the local hour inside the job to cover DST.
- Input: notes added or changed since the last run, plus series plans
  (e.g. `Express/Eden-Real-World-AI-Series.md`). Exclude anything the Phase 1 allow-list excludes.
- Output: 3 topics, each with a hook line, the angle, and the source note. Delivered by Slack DM
  (or email).
- Bony replies with 1, 2 or 3 → Claude drafts → Bony edits or approves → publish. **No post goes
  out without an explicit approval.** Keep a log of suggestions, choices and published URLs so
  topics aren't repeated.

## Out of scope

- "AI Clocks In at a Coffee Shop" series: the Harvest payroll automation is *proposed*, not built.
  Track it separately.

## Open decisions

1. Delivery channel for suggestions: Slack DM or email?
2. Publish timing: right after approval, or a scheduled slot (for example, the next morning)?
3. GitHub access: `Bonythomasv/bonythomas.ca` is not reachable from Claude cloud sessions yet.
   Connect GitHub / install the Claude GitHub App on it so cloud sessions can work on the code.
