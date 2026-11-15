# Workspace shell, AI chat and review

Part of the [project guide](../PROJECT.md) (was PROJECT.md section 7). "Section N" in the text means that old numbering; the guide maps it to files.

### Workspace (2026-11-08)

- The owner asked for the dashboard, Workshop and exams to become one Workspace with its own look (left tabs, AI chat,
  review of finished mocks), modelled on solvely.ai's layout: a 260px light-grey tab rail (collapsible to icons, saved in
  `education-workspace-rail`), a white canvas, one blue accent and Inter. Phones get a top bar and a slide-in menu.
- Routes: `/workspace` (home: composer, resume, stats, programmes, recent results, practice), `/workspace/chat`,
  `/workspace/vocabulary`, `/workspace/my-exams`, `/workspace/review` and `/workspace/review/[id]`, `/workspace/workshop`, plus the exam
  library pages above. `/dashboard`
  and `/workshop` redirect here; sign-in returns to `/workspace` by default. `/workspace/profile` and `/workspace/plans`
  (2026-11-08) replace `/profile` and `/plans`, which redirect (`/profile?error=` keeps its Google link error). The owner
  asked that the site header link only to Programmes and the Workspace: no Exams, Plans or profile button for members;
  guests still see Нэвтрэх. The rail's account row and the phone top-bar avatar open the profile; Plans is a rail tab.
  Since 2026-11-13 (owner request) the rail has no main-site link and no sign-out; signing out is on the profile page.
  Monthly plan purchase and renewal keep their `/subscribe/<program>` address but render inside the Workspace under the
  Plans tab (`src/app/subscribe/layout.tsx`, readable-scale tweaks in `subscribe.css`). Single-mock `/checkout/<slug>`
  uses the Workspace's Exams tab. Guided `/workshops/<slug>` tasks and all three `/labs/ielts-*` studios use the Workshop
  tab; their existing URLs, pilot switches and server access checks stay in place.
- The shell is `src/modules/workspace/shell.tsx` (client) behind `frame.tsx` (server: name, email, active plans). The
  shell omits guest chrome on Home, AI chat, Review and Profile while their server-side sign-in redirect resolves,
  so no sidebar is streamed before login. Guest-readable library, plans and Workshop pages keep their shell.
  The site header, footer and backdrop are hidden by CSS only while the shell is on the page (`body:has(.wsp)`), so 404s keep the
  site chrome. Embedded exam pages inherit the Workspace palette through the site tokens redefined on `.wsp`.
- AI chat: `POST /api/workspace/chat` (same origin, verified session, text plus up to three images and their previews, `CHAT_BODY_BYTES`). Modes ask, solve, explain, quiz, writing
  and vocab; subjects general, SAT, IELTS, ЭЕШ Math/Physics/English and JLPT; Mongolian or English. Six prior turns of at most
  2,500 characters are sent. 50 requests per student per Ulaanbaatar day with one in flight (`education-workspace-ai:*`).
  Refused before and after the provider call while any timed sitting is open; the local practice override does not apply.
  Threads live on the account (2026-11-13; `ChatThread`/`ChatMessage`, migration `20261112200000_chat_threads`): 30 threads per
  account (the least recently used goes), 60 messages per thread (the oldest go), 12,000 characters per message. The request names
  its thread (`threadId`, or null for a new one) and the position it has read (`after`); the browser sends no history, the server
  reads the last six turns from the stored thread. The question and answer are saved together, in one transaction, only after the
  reply arrives inside `chargeCredits`, so a failure leaves nothing and refunds; if the same question comes back after a lost
  response, the saved answer is returned with no provider call or charge. Full photos are never stored: a message keeps at most three
  small preview data URLs. Routes: `GET /api/workspace/chat/threads`, `GET`/`DELETE …/threads/[id]`, `POST …/threads/import`, all
  scoped to the student. Threads made before the move are sent once from the browser's `education-workspace-chats-v1:<userId>`;
  the server checks every field and keys the thread by SHA-256 of user and browser id, so it moves once (100 imports a day), and the
  browser key is removed. The list can be read during a timed sitting; only the AI is closed. Other tabs refresh when they regain focus.
- Review: finished mocks with scores (12 per page, programme filter), then per-question review with the snapshot's answer,
  key, explanation, printed choices, figures and transcripts, weakest skills, and an AI coach beside it (explain, my mistake,
  similar question, free questions). The server builds the coach's context from the student's own SUBMITTED snapshot via
  `ownMock`; the page sends only the attempt and question ids. Replies render as a small Markdown subset through React text.
