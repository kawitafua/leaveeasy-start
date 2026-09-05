# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LeaveEasy is a student lab project (ADT-RAISE Non-Degree Batch 2, Module 2, weeks 6–9): a plain HTML/CSS/JS
prototype of an online leave-request system, migrated incrementally onto Firebase (Firestore → Auth → Hosting →
Security Rules → an AI classify button). There is no build step and no framework.

**Read [leaveeasy-spec.md](leaveeasy-spec.md) before making any feature change.** It is the authoritative spec:
screen list, the 3 user roles (`employee` / `manager` / `hr`), the Firestore data model, the leave-request status
machine, and — critically — section 8 ("แผนการเติบโตรายสัปดาห์"), which lists exactly what belongs to each week,
and section 9 ("สิ่งที่ยังไม่ทำใน Module นี้"), which lists things that must NOT be built yet even if they seem
obviously useful. Do not implement ahead of the current week's scope; if something looks missing but is listed in
section 9, propose it and wait rather than adding it.

## Commands

Run from this directory (`leaveeasy/`):

```bash
npm run dev    # serve -l 3000 . — static file server at http://localhost:3000
npm run seed   # node scripts/seed.js — writes the sample dataset (§7 of the spec) into Firestore, one-time/idempotent by doc id
```

There is no lint, build, or test command — this project intentionally has no tooling beyond a static server.

## Architecture

- **5 pages, no router**: `index.html`, `leave-requests.html`, `new-leave-request.html`,
  `leave-request-detail.html`, `leave-types.html`. Each page is a plain `<script defer>` chain — no bundler, no
  modules. Navigation between pages is via `<a href>` / `location.href`, and data crosses pages via the Firestore
  document id in the URL query string (e.g. `leave-request-detail.html?id=lr001`), read with `ค่าจากURL()` in
  [js/util.js](js/util.js).
- **One JS file per page** in `js/`, each wrapped in an IIFE and loaded only by its own page (see the `<script>`
  tags at the top of each `.html` file). [js/nav.js](js/nav.js) (top navbar) and [js/util.js](js/util.js) (`esc`,
  `ป้ายสถานะ`, `เวลาตอนนี้`, `ค่าจากURL`) are shared across pages.
- **Identifiers are intentionally bilingual**: function/variable names are Thai where they name domain concepts
  (`วาดตาราง`, `เปลี่ยนสถานะ`, `รหัสใบลา`), while Firestore field names and collection names are always English
  per the spec (`status`, `leaveTypeId`, `requesterName`, `createdAt`, ...). Never rename a Firestore field —
  spec §5.2 explicitly warns that `status` vs `Status` is a silent, system-breaking bug in Firestore.
- **Migration in progress, page by page**: as of the last commit, [leave-requests.js](js/leave-requests.js) reads
  live from Firestore (`db.collection("leaveRequests").get()`), but [new-leave-request.js](js/new-leave-request.js),
  [leave-request-detail.js](js/leave-request-detail.js), and [leave-types.js](js/leave-types.js) still read/write
  only [js/data.js](js/data.js) (`window.LEAVE_DATA`) and `sessionStorage` — nothing they do persists across a
  refresh yet. Don't assume all pages are on Firestore; check each page's own script includes and top comment
  (they self-document which week/stage they're at) before editing.
- **Firestore access is direct from the browser** — there is no server of any kind (by design, see spec §9). Pages
  that touch Firestore load the compat SDK via CDN `<script>` tags (`firebase-app-compat.js` +
  `firebase-firestore-compat.js`) before [js/firebase-config.js](js/firebase-config.js), which calls
  `firebase.initializeApp()` and exposes a global `db`. [scripts/seed.js](scripts/seed.js) is the one place that
  uses the modular Node SDK (`firebase/app`, `firebase/firestore`) instead, since it runs outside the browser.
- **Data model** (see spec §5 for full field list): `users`, `leaveTypes`, `leaveRequests` are top-level
  collections; `approvals` is a subcollection nested under each `leaveRequests/{id}`. Firestore has no JOIN, so
  `leaveRequests` and `approvals` documents denormalize (duplicate) the human-readable name alongside every foreign
  key (`requesterId`+`requesterName`, `approverId`+`approverName`, `leaveTypeId`+`leaveTypeName`,
  `authorId`+`authorName`) — always write both together, never just the id.

  **All Firestore collections** (spelled exactly like this — camelCase, no underscore, per spec §5.2):
  - `users` — top-level
  - `leaveTypes` — top-level
  - `leaveRequests` — top-level
  - `leaveRequests/{id}/approvals` — subcollection nested under each leave request

- **Status is a one-way state machine** — the `status` field on a `leaveRequests` document holds exactly one of
  these 3 Thai string values, nothing else:
  - `รอพิจารณา` (pending) — the default status every new leave request is created with
  - `อนุมัติ` (approved) — reachable only from `รอพิจารณา`
  - `ไม่อนุมัติ` (rejected) — reachable only from `รอพิจารณา`, and only if the request already has at least one
    `approvals` entry (see spec §6)

  `อนุมัติ` and `ไม่อนุมัติ` are terminal — never write code that transitions a request away from them. A status
  change must update only the `status` field on the existing document, never rewrite the whole document.
- [js/data.js](js/data.js) is the fixture data — field names there match Firestore exactly on purpose, since the
  same records get seeded into Firestore later. When adding a screen, keep any new fixture fields consistent with
  the spec's field table (§5.2) rather than inventing new names.

## Rules

- **Never commit secret keys to a file that gets pushed.** The Firebase *web* config in
  [js/firebase-config.js](js/firebase-config.js) (and duplicated in [scripts/seed.js](scripts/seed.js)) is the one
  intentional exception — a Firebase web `apiKey` is a public client identifier, not a secret, and is meant to be
  committed. Any other credential — an OpenRouter/other AI API key (coming in week 8 for the AI leave-type
  classifier), a service-account JSON, an admin/private key — must never be hardcoded into a committed file. Keep
  those in an untracked `.env`/local config and load them at runtime instead.
