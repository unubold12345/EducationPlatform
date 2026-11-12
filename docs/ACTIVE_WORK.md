# Active work board

Short-lived coordination between AI agents (for example Codex and Claude Code) working in this
repository at the same time. The permanent record stays in [OPERATIONS.md](./OPERATIONS.md).

## Rules

1. **Check this file before starting any task**, and check it again right before any shared action:
   production build, restarting the 3001 preview, database changes, commit or push.
2. **Claim before working.** Add one row with your agent name and model, start time (Ulaanbaatar),
   task, the files/areas you will change and any shared resources you need.
3. **Do not touch claimed work.** If your task needs a file, area or shared resource another row
   claims, stop and ask the owner. Never edit, revert, commit or re-attribute another agent's work.
4. **Shared resources need a claim:**
   - `build + 3001`: `npm run build` and the 3001 preview. Only the holder may rebuild or restart it.
     Others preview on their own port (for example `next dev -p 3005`).
   - `database`: migrations, seeds or bulk QA data. Mind the real auth rate limits when several
     agents run browser suites.
   - `git`: commit and push. Push also deploys to Vercel production.
5. **Keep your row current.** Update `Status` when it changes (in progress, testing, waiting, blocked).
6. **Finish cleanly.** When the task is done, delete your row and write the outcome in `OPERATIONS.md`
   with an `Agent:` line.
7. **Stale rows.** A row older than 4 hours without an update may be abandoned. Ask the owner before
   removing or overriding it. Never delete another agent's row on your own.
8. **Warn the owner before starting a colliding task.** When the owner gives you a task, compare it
   with this board first. If it would change files/areas another row claims, need a shared resource
   another row holds, or interrupt another agent (rebuild, preview restart, database change, push),
   tell the owner which agent, files or resources are affected and wait for their decision before
   starting. If nothing collides, say so briefly and proceed.

## Current work

| Agent | Started (UB) | Task | Files / areas | Shared resources | Status |
| --- | --- | --- | --- | --- | --- |
| Claude Code (Claude Fable 5.2) | 2026-11-11 00:22 | Owner asked for the local server: `next dev` on 3001 serving the working tree (no build) | none | 3001 (dev server, not a build) | running; ask the owner before stopping or rebuilding |
| Claude Code (Claude Fable 5.2), second session | 2026-11-11 01:25 | Owner asked this session to start a server: `next dev` on 3005 serving the working tree | none | 3005; it holds the `.next/dev` lock, so a second `next dev` cannot start beside it | running; ask the owner before stopping |
| Claude Code (Claude Opus 5.5, then Claude Fable 5.2), third session | 2026-11-11 | Owner asked this session to start the server: database on 51214 and `next dev` on 3001 serving the working tree (no build). The Vocabulary redesign is finished (see OPERATIONS Recent) | none | 3001 (dev server, not a build), started from this session's preview | running; ask the owner before stopping or rebuilding |
| Claude Code (Claude Fable 5.2), my-exams session | 2026-11-12 09:26 | My-exams polish is finished (see OPERATIONS Recent). A production preview of that build is left open for the owner to look at | none | 3006 (`next start` from this session's preview, on the current `.next` build) and the local database on 51214, which this session started. A rebuild replaces `.next` under it, and it holds the single database connection | preview running since 09:42; ask the owner before stopping or rebuilding |
| Claude Code (Claude Fable 5.2), exam-storage session | 2026-11-12 18:16 | Exam storage on the account is finished (see OPERATIONS Recent). A production preview of that build is left open for the owner to look at | none | 3006 (`next start` from this session's preview, on the current `.next` build) and the local database on 51214, which this session restarted after it dropped. A rebuild replaces `.next` under it, and it holds the single database connection. The 09:26 row above no longer holds 3006: the owner approved stopping that preview at 18:16 | preview running since 18:48; ask the owner before stopping or rebuilding |
| Claude Code (Claude Fable 5.2), speaking-scale session | 2026-11-12 20:30 | Owner-authorized commit, push and deploy of the hosted speech provider only | none | `git` (push deploys to production). This session's 3005 preview is stopped. `npm run check:push` rebuilt `.next` at 20:25 with owner approval, so the 3006 preview in the row above needs a restart | pushing |
