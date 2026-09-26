# AGENT_CONTINUITY.md

Purpose: prevent context loss across Antigravity sessions, restarts, or account switches. This file's rules apply regardless of what any chat history appears to say.

## Core Rule

**Antigravity must NOT rely on chat history as a source of truth.** Chat history may be incomplete, from a different session, or from a different account. The repository and the six documentation files are the only trustworthy state.

## Mandatory Session-Start Checklist

At the start of every session, before writing or changing anything, Antigravity must:

1. Read all six documentation files in full: `PROJECT_SPEC.md`, `TECHNICAL_ARCHITECTURE.md`, `DATABASE_SPEC.md`, `IMPLEMENTATION_PLAN.md`, `ANTIGRAVITY_HANDOFF.md`, `AGENT_CONTINUITY.md` (this file).
2. Inspect the actual repository file tree — do not assume structure.
3. Inspect `package.json` (dependencies actually installed, scripts actually defined).
4. Inspect `prisma/schema.prisma` and the `prisma/migrations/` directory — confirm what has actually been migrated, not just what's written in the schema file.
5. Inspect relevant source files directly (route handlers, server actions, components) rather than trusting file names or prior summaries.
6. Run `git status` (and `git log --oneline -10` if useful) if git is available, to see actual uncommitted/committed state.
7. Run appropriate checks: `npm run build` or `npm run dev` health check, `npx prisma studio` or a direct query to confirm seed data, and any existing test scripts.
8. Compare the actual implementation found in steps 2–7 against `ANTIGRAVITY_HANDOFF.md`'s "Persistent Handoff State" section and against `IMPLEMENTATION_PLAN.md` phases. Note any discrepancy explicitly.
9. Continue only from this verified current state — not from what the handoff file *claims*, if inspection contradicts it.

## Anti-Hallucination Rules

Antigravity must:

- Never assume previous work exists without inspecting the actual files/DB.
- Never claim a feature is "complete" without having run it and observed the result in this session.
- Never claim a test passed unless it was actually executed in this session.
- Never invent missing files, API routes, database fields, or functionality that isn't actually present — if something referenced in the docs doesn't exist yet, build it or report the gap.
- Never silently change requirements defined in `PROJECT_SPEC.md`, `TECHNICAL_ARCHITECTURE.md`, or `DATABASE_SPEC.md`. If a requirement seems wrong or infeasible in the remaining time, flag it explicitly rather than quietly deviating.
- When uncertain about current state, inspect the repository again rather than guessing.
- When a minor, undocumented detail must be decided (e.g. exact wording of a fallback string, a color value), choose the smallest reasonable solution and record it (see below) rather than pausing for clarification.
- Document important architectural decisions where they were made (inline code comment or a short note in `ANTIGRAVITY_HANDOFF.md`'s handoff state), so a future session understands *why*, not just *what*.

## End-of-Session Checklist

Before ending any session, Antigravity must:

1. Save all work (ensure files are written to disk / committed if git is in use).
2. Run relevant checks one more time (build, seed query, or manual flow test) to confirm the session's changes actually work.
3. Record the *actual observed* status in `ANTIGRAVITY_HANDOFF.md`'s Persistent Handoff State — not the intended status.
4. Record any known errors verbatim (exact message/stack trace), even if unresolved.
5. Update every field of the Persistent Handoff State block in `ANTIGRAVITY_HANDOFF.md`: Current Phase, Completed, In Progress, Remaining, Current Errors, Last Verification, Next Action, Files Changed, Blockers.
6. Record any important decisions made this session (in the same file or an inline comment) so the next session doesn't relitigate or contradict them.
7. Set an exact, concrete Next Action — specific enough that a new session with no memory of this one can start immediately (e.g. "Implement `getNextDifficulty()` in `lib/adaptiveQuiz.ts` per TECHNICAL_ARCHITECTURE.md §6, then wire into the quiz route handler" — not "continue quiz work").

## Verification Before Final Completion

Before declaring the project done, explicitly verify the full cycle end-to-end, per `IMPLEMENTATION_PLAN.md` Phase 10 and `PROJECT_SPEC.md` §11:

```
Diagnostic → Analysis → Personalized Path → AI Support → Adaptive Quiz → Updated Mastery → Updated Recommendations
```

Required test runs (both must actually be executed and their results observed, not assumed):
- A strong-performance scenario.
- A poor-performance scenario.

Confirm — by inspecting actual DB rows and actual rendered screens — that adaptive difficulty and recommendations genuinely differ between the two scenarios. Only after this verification may the project be marked complete in `ANTIGRAVITY_HANDOFF.md`.

## New Session / New Account Continuity

A new Antigravity session or a different account must be able to pick up work using only: this repository + the six documentation files. No dependency on any specific chat thread. If the Persistent Handoff State in `ANTIGRAVITY_HANDOFF.md` is stale, trust the repository inspection (steps 2–7 above) over the stale text, fix the text, and proceed.
