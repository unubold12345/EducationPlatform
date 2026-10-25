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
| Claude Code (Claude Opus 5.5) | 2026-10-25 13:20 | Verify and push all completed work (image fix, dashboard, EEC English archive, docs) | whole repo read-only; may fix test-found issues | `git` | committing and pushing |
