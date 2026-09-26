# IMPLEMENTATION_PLAN.md

Strict build order for the 5-hour hackathon window. Do not reorder phases; later phases depend on earlier ones. Full requirement definitions live in PROJECT_SPEC.md, TECHNICAL_ARCHITECTURE.md, DATABASE_SPEC.md — this file only sequences the work.

Each phase: **Build / Result / Verify / Depends on**.

---

## Phase 1 — Project Setup (~20 min)

- **Build:** Next.js app (App Router) + Tailwind. Install Prisma + `pg`. Add `.env` with `DATABASE_URL`. Add LLM SDK for the chosen provider, store API key server-side only.
- **Result:** App boots at localhost with a blank Start page. `npx prisma init` complete.
- **Verify:** `npm run dev` serves a page; `npx prisma --version` works.
- **Depends on:** nothing.

## Phase 2 — Prisma Schema, PostgreSQL, Seed (~40 min)

- **Build:** Implement `schema.prisma` exactly per DATABASE_SPEC.md. Run migration. Write `seed.ts` covering: subject/topics/concepts, prerequisite edges, diagnostic + quiz question pools, 2 seeded demo students with realistic pre-existing `StudentConceptPerformance` (one strong overall, one weak overall) so their differing Learning Paths can be shown immediately if needed, and no seeded performance for the live-demo student.
- **Result:** `npx prisma migrate dev` succeeds; `npx prisma db seed` populates all tables; data is inspectable via `npx prisma studio`.
- **Verify:** Query counts: 7 concepts, ≥5 prerequisite edges, ≥14 diagnostic questions, ≥42 quiz questions, 2+ students with performance rows.
- **Depends on:** Phase 1.

## Phase 3 — Diagnostic Assessment (~40 min)

- **Build:** Start screen (pick/create student). Diagnostic screen serving the `isDiagnostic=true` question pool. Submit action: writes `AssessmentAttempt` (type DIAGNOSTIC) + `Answer` rows, computes overall and per-concept raw scores.
- **Result:** Completing the diagnostic persists real rows in `AssessmentAttempt` and `Answer`.
- **Verify:** Inspect DB after a run — attempt + answers exist and match what was clicked; overall score matches manual calculation.
- **Depends on:** Phase 2.

## Phase 4 — Knowledge Analysis (~30 min)

- **Build:** Analysis Engine: for each concept touched, compute `newMastery = previousMastery*0.7 + currentPerformance*0.3` (previousMastery=0 for first pass), upsert `StudentConceptPerformance`, set `status` via fixed thresholds. Knowledge Analysis screen displaying overall performance, per-concept mastery, strengths/weaknesses/gaps.
- **Result:** `StudentConceptPerformance` rows exist and match formula output; UI reflects them.
- **Verify:** Manually recompute the formula for one concept and confirm the stored value matches. Confirm classification boundaries (39% = GAP, 40% = DEVELOPING, 70% = STRONG) are exact.
- **Depends on:** Phase 3.

## Phase 5 — Prerequisite Logic + Personalized Path (~40 min)

- **Build:** Prerequisite Engine (read `ConceptPrerequisite`, flag `prerequisiteBlocked`). Path Generator producing ordered `LearningPathItem`s per TECHNICAL_ARCHITECTURE.md §4 step 4. Learning Path screen rendering the ordered list with each item's `reason`.
- **Result:** A student weak in "Trees" and "Binary Trees" sees Trees ordered before Binary Trees before Tree Traversal, with visible reasons.
- **Verify:** Run with the two seeded demo students (strong vs weak) and confirm their generated paths differ in both content and order — screenshot/compare.
- **Depends on:** Phase 4.

## Phase 6 — AI Learning Support (~35 min)

- **Build:** AI Support Module: context builder (concept, mastery, weak areas, recent score, difficulty) → single LLM call → render explanation/example/practice on the Learning Support screen. Implement fallback static content per concept and a retry button for failures/timeouts.
- **Result:** Opening a concept from the Learning Path produces AI text visibly tailored to that student's mastery/weak-area context (different students → different phrasing/focus).
- **Verify:** Compare AI output for the strong vs weak seeded student on the same concept — content should differ (e.g. weak student's output should reference the weak area/lower difficulty). Kill network/API key temporarily and confirm fallback renders instead of a crash.
- **Depends on:** Phase 4 (needs mastery data); independent of Phase 5.

## Phase 7 — Adaptive Quiz (~45 min)

- **Build:** Adaptive Quiz Engine (pure function `getNextDifficulty`) per TECHNICAL_ARCHITECTURE.md §6. Quiz screen: starts at difficulty derived from current mastery, serves next question by calling the engine after each answer, writes a `QuizAttempt` row per question served.
- **Result:** A sequence of correct answers visibly escalates difficulty (Easy→Medium→Hard after 2 consecutive correct); an incorrect answer visibly drops difficulty immediately.
- **Verify:** Run one quiz answering all correctly (expect escalation) and one answering all incorrectly (expect rapid de-escalation to Easy). Confirm `QuizAttempt.difficultyServed` sequence in the DB matches what was shown on screen.
- **Depends on:** Phase 4 (starting difficulty), Phase 2 (question pool).

## Phase 8 — Continuous Profile Updates (~30 min)

- **Build:** After quiz completion, re-run Phase 4's Analysis Engine + Phase 5's Path Generator for the affected concept(s); mark previous `LearningPath.isCurrent=false`, create new current path. Updated Recommendations screen shows the new path/mastery, explicitly diffed or labeled as "updated".
- **Result:** Post-quiz mastery and path visibly change from pre-quiz state for the same student.
- **Verify:** Record a student's mastery/path before a quiz, run the quiz, confirm mastery changed per the formula and the path re-ordered if thresholds crossed.
- **Depends on:** Phases 4, 5, 7.

## Phase 9 — UI Polish (~30 min)

- **Build:** Apply consistent Tailwind styling across all 7 screens per PROJECT_SPEC.md §9 UI requirements: typography, spacing, cards, progress indicators (mastery bars), loading/error states, simple nav between the 7 screens in cycle order.
- **Result:** Visually consistent, uncluttered, professional UI; no dead-end screens.
- **Verify:** Click through all 7 screens in order with no missing states (loading, empty, error all render something sensible).
- **Depends on:** Phases 3–8 functionally complete.

## Phase 10 — End-to-End Testing (~30 min)

- **Build:** Nothing new — verification only.
- **Result:** Full cycle confirmed working for two different performance profiles.
- **Verify (must run both):**
  - **Strong-performance run:** new/live student answers diagnostic + quiz mostly correctly → expect high mastery, few/no gaps, quiz difficulty escalating to Hard, path mostly "Strong — optional review".
  - **Poor-performance run:** new/live student answers mostly incorrectly → expect low mastery, multiple gaps, quiz difficulty dropping to Easy, path prioritizing prerequisite gaps (e.g. Trees before Binary Trees).
  - Confirm the two runs produce **different** Learning Paths and different quiz difficulty trajectories (proves no hardcoded path/adaptivity).
- **Depends on:** all prior phases.

---

## Time Budget (5 hours total)

| Phase | Time |
|---|---|
| 1 | 20 min |
| 2 | 40 min |
| 3 | 40 min |
| 4 | 30 min |
| 5 | 40 min |
| 6 | 35 min |
| 7 | 45 min |
| 8 | 30 min |
| 9 | 30 min |
| 10 | 30 min |
| **Total** | **~5h** |

If time runs short, cut in this order: Phase 9 polish depth → Phase 6 AI (fallback-only is acceptable) → never cut Phases 2–5, 7, 8, 10 (these are the graded core loop).
