# TECHNICAL_ARCHITECTURE.md

Scope, features, and screens are defined in PROJECT_SPEC.md — not repeated here. This document defines *how* the system is built.

## 1. Stack

- **Frontend:** Next.js (App Router) + React + Tailwind CSS
- **Backend:** Next.js server actions / route handlers (no separate backend service)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **AI:** One LLM API (any single provider — e.g. Anthropic or OpenAI; pick one and use it consistently). Called only server-side, never from the browser (keep API key server-only).

No microservices, no message queues, no separate auth service, no external state store. A single Next.js app + Postgres is the entire system.

## 2. High-Level Architecture

```
Browser (React screens)
   │  fetch / server actions
   ▼
Next.js Server Layer
   ├── Assessment Engine        (scoring, persistence)
   ├── Analysis Engine          (mastery calc, gap detection)
   ├── Prerequisite Engine      (graph read + prioritization)
   ├── Path Generator           (produces ordered LearningPath)
   ├── Adaptive Quiz Engine     (deterministic difficulty state machine)
   ├── AI Support Module        (LLM calls, context building, fallback)
   └── Prisma Client
         ▼
   PostgreSQL
```

All deterministic logic (scoring, mastery, gaps, prerequisites, path ordering, quiz difficulty) lives in plain server-side TypeScript modules — never in the LLM.

## 3. Module Responsibilities

| Module | Responsibility | Must NOT do |
|---|---|---|
| Assessment Engine | Serve diagnostic questions across concepts, record `Answer` rows, compute per-attempt score | Decide mastery weighting |
| Analysis Engine | Read `StudentConceptPerformance`, apply mastery formula, classify Strong/Developing/Gap | Call the LLM |
| Prerequisite Engine | Read `ConceptPrerequisite` edges, flag prerequisite concepts below threshold | Change thresholds ad hoc |
| Path Generator | Combine Analysis + Prerequisite output into an ordered `LearningPath` + `LearningPathItem` list | Hardcode order |
| Adaptive Quiz Engine | Track running quiz performance, select next question's difficulty deterministically | Ask the LLM to pick difficulty |
| AI Support Module | Build a context object, call the LLM, return explanation/example/practice text, fall back on failure | Write to mastery/performance tables, decide prerequisites |

## 4. Data Flow (per PROJECT_SPEC.md cycle)

1. **Diagnostic submit** → Assessment Engine writes `AssessmentAttempt` + `Answer` rows → computes overall & per-concept scores.
2. **Analysis** → Analysis Engine upserts `StudentConceptPerformance` per concept using the mastery formula → classifies each concept Strong/Developing/Gap.
3. **Prerequisite check** → Prerequisite Engine reads `ConceptPrerequisite`; any concept whose prerequisite is "Developing" or "Knowledge Gap" is flagged `prerequisiteBlocked = true`.
4. **Path generation** → Path Generator sorts concepts: (a) Knowledge Gap concepts whose prerequisites are already Strong, first; (b) prerequisite gaps before their dependents; (c) Developing concepts; (d) Strong concepts last (for review only). Writes `LearningPath` + ordered `LearningPathItem` rows.
5. **Learning Support** → student opens a concept → AI Support Module builds context (concept, mastery, weak areas, recent score, current difficulty) → calls LLM → renders explanation/example/practice.
6. **Adaptive Quiz** → Adaptive Quiz Engine starts at Medium (or at the difficulty implied by current mastery — see §5), adjusts per answer, persists each `QuizAttempt`.
7. **Recompute** → After the quiz, steps 2–4 re-run for the affected concept(s) → `StudentConceptPerformance`, `LearningPath` updated → Updated Recommendations screen reads the new state.

No screen ever computes mastery, gaps, or path order client-side — the client only renders server-computed/persisted results.

## 5. Mastery & Difficulty Starting State

- New concept, no prior data: `previousMastery = 0`; first score becomes `newMastery = 0 × 0.7 + score × 0.3`. (This intentionally produces a low first-pass value; acceptable for a diagnostic — document this choice, do not "fix" it by seeding fake priors.)
- Quiz starting difficulty for a concept = based on current stored mastery: `< 40% → Easy`, `40–69% → Medium`, `≥ 70% → Hard`.

## 6. Adaptive Quiz Algorithm (deterministic, fixed)

State per quiz session: `currentDifficulty`, `consecutiveCorrect`, `consecutiveIncorrect`.

- Correct answer → `consecutiveCorrect++`, `consecutiveIncorrect = 0`. If `consecutiveCorrect >= 2` and not already Hard → increase difficulty one step (Easy→Medium→Hard), reset counter.
- Incorrect answer → `consecutiveIncorrect++`, `consecutiveCorrect = 0`. Immediately decrease difficulty one step (Medium→Easy, Hard→Medium) — poor performance drops difficulty faster than good performance raises it, per spec ("Hard → Medium → Easy" on poor performance).
- Difficulty never goes below Easy or above Hard.
- Every question served and answered is persisted as a `QuizAttempt` row with the difficulty it was served at.

This logic lives in one pure function (e.g. `getNextDifficulty(state, wasCorrect)`) so it is trivially testable and demonstrably not UI-faked.

## 7. AI Integration

- Single server-side function, e.g. `getAISupport(context)`, called from a route handler / server action.
- **Context payload sent to LLM** (assembled server-side from DB, never invented client-side):
  ```
  concept: string
  masteryPercent: number
  weakAreas: string[]        // other concepts classified Developing/Gap
  recentScorePercent: number // most recent attempt score for this concept
  currentDifficulty: "Easy" | "Medium" | "Hard"
  requestType: "explanation" | "example" | "practice_question"
  ```
- **AI is restricted to producing text/content only.** It never returns a value that is written back into `StudentConceptPerformance`, `ConceptPrerequisite`, or `LearningPath`.
- **Timeout:** set a reasonable client-side timeout (e.g. 10–15s) around the LLM call.

## 8. Error Handling & Fallback

- **LLM call fails or times out:** return a static, concept-specific fallback string (e.g. a pre-written short explanation per concept, stored as a constant or seed row) and show a "Regenerate" retry button. The rest of the app (path, quiz, mastery) is unaffected — AI is additive, never a dependency for the core loop.
- **DB write failure during assessment/quiz:** show an inline error state on the current screen; do not advance the cycle step until the write succeeds; log the error server-side.
- **Missing/undefined student state on load** (e.g. no diagnostic taken yet): redirect to Start / Diagnostic screen rather than rendering an empty analysis.
- All server actions/route handlers wrap DB and LLM calls in try/catch and return a typed `{ success, data?, error? }` shape so the UI can render loading/error/success states consistently.

## 9. Simplicity Rules

- One Next.js app, one Postgres DB, one Prisma schema, one LLM provider.
- No client-side state management library beyond React state/context — this is a small, linear flow.
- No auth system required for the hackathon demo; a single seeded "current student" (or a simple student picker for 2 demo students) is sufficient — see DATABASE_SPEC.md §7 and IMPLEMENTATION_PLAN.md.
