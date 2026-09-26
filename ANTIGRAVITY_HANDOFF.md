# ANTIGRAVITY_HANDOFF.md

**You (Antigravity) are the coding agent. You must actually write, run, and test code — not just describe it.**

This file is your primary work order. It cross-references the other five docs instead of repeating them:
- Product scope/screens/acceptance criteria → `PROJECT_SPEC.md`
- Architecture/data flow/AI integration/error handling → `TECHNICAL_ARCHITECTURE.md`
- Prisma schema detail → `DATABASE_SPEC.md`
- Build order/phases → `IMPLEMENTATION_PLAN.md`
- Session continuity/anti-hallucination rules → `AGENT_CONTINUITY.md` (**read this before doing anything**)

## Operating Rule (every step, no exceptions)

```
Inspect → Implement → Run → Test → Fix → Continue
```

Never mark a step done without running it and observing the result.

## 1. Objective

Build a working Next.js + PostgreSQL + Prisma app implementing the adaptive learning cycle defined in `PROJECT_SPEC.md`: Assessment → Knowledge Analysis → Personalized Learning → Adaptive Quiz → Updated Recommendations, for the Data Structures subject only.

## 2. Tech Stack (fixed)

Next.js (App Router) + React + Tailwind CSS, Next.js server actions/route handlers, PostgreSQL, Prisma, one LLM API called server-side only. No other infrastructure.

## 3. Strict Scope

Exactly the 7 concepts, exactly the 7 screens, exactly the features listed in `PROJECT_SPEC.md` §5. Do not add anything from the "Explicitly Out of Scope" list in `PROJECT_SPEC.md` §10, even if it seems like a natural improvement. If a requirement is ambiguous, choose the smallest reasonable solution and record the decision (see `AGENT_CONTINUITY.md`).

## 4. Required Screens

Start → Diagnostic Assessment → Knowledge Analysis → Personalized Learning Path → Learning Support → Adaptive Quiz → Updated Recommendations. No additional pages.

## 5. Database Requirements

Implement `schema.prisma` exactly per `DATABASE_SPEC.md`. Run migrations against a real PostgreSQL instance. Seed per `DATABASE_SPEC.md` §7. Do not invent fields not listed there without recording the decision.

## 6. Adaptive Logic (non-negotiable)

Implemented as a pure, testable function per `TECHNICAL_ARCHITECTURE.md` §6. Quiz difficulty must be driven by actually-stored `QuizAttempt` correctness, never simulated or randomized in the UI layer.

## 7. Prerequisite Logic (non-negotiable)

`ConceptPrerequisite` rows are real DB relationships (`DATABASE_SPEC.md` §2, §4) and must measurably reorder `LearningPathItem` output. Test this explicitly (see §11 below).

## 8. Mastery Formula (non-negotiable)

`newMastery = previousMastery * 0.7 + currentPerformance * 0.3`, thresholds Strong ≥70 / Developing 40–69 / Gap <40, exactly as in `PROJECT_SPEC.md` §6–7. The AI must never compute or influence this value.

## 9. AI Responsibilities (strict boundary)

The LLM may ONLY generate: personalized explanations, examples, practice questions — using the context object defined in `TECHNICAL_ARCHITECTURE.md` §7. The LLM must NEVER: set mastery, decide prerequisites, decide quiz difficulty, write to the database directly, or generate the learning path order.

## 10. Fallback Behavior (required, must be tested)

If the LLM call fails or times out, render static fallback content (per concept) and a retry affordance. The rest of the app (analysis, path, quiz, mastery) must keep working with the LLM completely disabled. Verify this by disabling the API key and re-running the flow.

## 11. Seed Requirements

Per `DATABASE_SPEC.md` §7: all 7 concepts, required prerequisite edges, ≥14 diagnostic questions, ≥42 quiz questions (≥2 per concept per difficulty), 2 pre-seeded demo students (one strong, one weak) plus support for a fresh live-demo student. The demo must require zero manual database editing.

## 12. Implementation Order

Follow `IMPLEMENTATION_PLAN.md` phases 1–10 in exact order. Do not start a phase until the previous phase's "Verify" step has actually passed.

## 13. Testing Requirements

At minimum, before declaring any phase complete:
- Re-run the relevant "Verify" step from `IMPLEMENTATION_PLAN.md` and observe actual output (DB query, screenshot, or console log) — not an assumption.
- Before final completion, run the full cycle twice end-to-end: once with a strong-performance pattern, once with a poor-performance pattern (`IMPLEMENTATION_PLAN.md` Phase 10). Confirm the two runs produce different learning paths and different quiz difficulty trajectories.
- Confirm the LLM-failure fallback path (§10) with a real test, not by inspection of code alone.

## 14. Acceptance Criteria

Identical to `PROJECT_SPEC.md` §11 — all 10 points must be independently verified before this project is considered done.

---

## Persistent Handoff State

**Update this section at the end of every session. This is the single source of truth for what has actually been done — not chat memory.**

```
Current Phase:        Between Phase 2 (DB/Seed) and Phase 3 (Diagnostic Assessment)
                      All lib/ modules and API routes exist but DB has never been migrated.

Completed:
  Phase 1 — Project Setup:
    - Next.js 14 (App Router) + Tailwind + Prisma + Anthropic SDK installed
    - package.json scripts: dev, build, db:migrate, db:seed, db:reset, db:studio
    - .env present with DATABASE_URL + ANTHROPIC_API_KEY placeholders
    - App boots at localhost:3000 (verified: npm run dev running)
    - tsconfig.json: target=es2017 + downlevelIteration=true added (session fix)
    - npx prisma generate: re-run this session; Prisma client now has enums

  TypeScript: 0 errors (verified: npx tsc --noEmit exits 0 after this session's fixes)

  Code written (NOT YET RUN END-TO-END, DB not migrated):
    - lib/prisma.ts          — PrismaClient singleton
    - lib/analysisEngine.ts  — computeMasteryStatus, applyMasteryFormula, computeConceptScores, computeOverallScore
    - lib/adaptiveQuiz.ts    — getNextDifficulty, startingDifficultyFromMastery, initQuizState (pure functions)
    - lib/pathGenerator.ts   — generateLearningPath, getCurrentLearningPath, updateConceptPerformance
    - lib/aiSupport.ts       — getAISupport with Anthropic + static fallback per concept (all 7 concepts covered)
    - prisma/schema.prisma   — All models per DATABASE_SPEC.md; schema validates OK
    - prisma/seed.ts         — Exists (30 KB); NOT YET RUN
    - app/page.tsx           — Start screen (student picker/creator)
    - app/diagnostic/page.tsx — Diagnostic Assessment screen
    - app/analysis/page.tsx  — Knowledge Analysis screen
    - app/path/page.tsx      — Personalized Learning Path screen
    - app/learn/page.tsx     — Learning Support (AI) screen
    - app/quiz/page.tsx      — Adaptive Quiz screen
    - API routes:
        GET  /api/students, POST /api/students
        GET  /api/diagnostic, POST /api/diagnostic/submit
        GET  /api/analysis
        GET  /api/path (auto-generates if missing)
        POST /api/ai-support
        GET  /api/quiz, POST /api/quiz/answer, POST /api/quiz/complete

In Progress:
  - Phase 2: schema.prisma exists + seed.ts exists, but:
      * No migrations/ folder — migration has NEVER been run
      * DB has never been seeded
      * DATABASE_URL in .env is a placeholder (postgres:password@localhost:5432/studybuddy)
      * ANTHROPIC_API_KEY in .env is a placeholder ("your-anthropic-api-key-here")

Remaining:
  Phase 2 (ACTUAL DB WORK):
    - Configure real DATABASE_URL in .env
    - npx prisma migrate dev --name init
    - npm run db:seed (verify counts: 7 concepts, ≥5 prereq edges, ≥14 diag Qs, ≥42 quiz Qs, 2 seeded students)
  Phase 3: Verify diagnostic flow writes real DB rows (inspect with prisma studio)
  Phase 4: Verify analysis/mastery formula output matches manual calculation
  Phase 5: Verify seeded student paths differ
  Phase 6: Verify AI fallback works when API key is bad
  Phase 7: Verify quiz difficulty trajectory in QuizAttempt rows
  Phase 8: Verify post-quiz mastery update + path regeneration
  Phase 9: UI polish review (mostly done — all 7 screens rendered)
  Phase 10: End-to-end cycle × 2 (strong performer + poor performer)

Current Errors:
  NONE in TypeScript (0 errors after this session's fixes).
  CRITICAL BLOCKERS: DATABASE_URL and ANTHROPIC_API_KEY are placeholders — DB cannot be reached.

Last Verification:
  - 2026-09-26: npx tsc --noEmit → exit 0 (zero errors) ✓
  - 2026-09-26: npm run dev → server starts at localhost:3000 ✓
  - 2026-09-26: npx prisma generate → Prisma Client v6.19.3 generated ✓
  - 2026-09-26: npx prisma validate → schema valid ✓
  - git log: single commit "Initial Implementation Checkpoint"
  - NO migration has been run. NO seed has been run. DB is untouched.

Next Action:
  USER MUST first set real values in .env:
    DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>"
    ANTHROPIC_API_KEY="sk-ant-..."
  Then run: npx prisma migrate dev --name init
  Then run: npm run db:seed
  Then verify seed counts via npx prisma studio or direct query.
  THEN (and only then) proceed to Phase 3 verification.

Files Changed This Session:
  - tsconfig.json (added target: es2017, downlevelIteration: true)
  - lib/analysisEngine.ts (fixed for...of Map → Array.from)
  - app/api/diagnostic/submit/route.ts (fixed for...of Map → Array.from)
  - app/api/quiz/answer/route.ts (fixed [...Set] spread → Array.from)
  - ANTIGRAVITY_HANDOFF.md (this update)
  [Prisma client regenerated in node_modules — not a source file change]

Blockers:
  1. DATABASE_URL placeholder — cannot run migration or seed without a real PostgreSQL instance.
  2. ANTHROPIC_API_KEY placeholder — AI will use static fallback (acceptable per spec, but real API unverified).
  3. No migration has been run — ALL DB-dependent features are unverified (everything beyond TypeScript parsing).
```

