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
Current Phase:        [e.g. Phase 4 — Knowledge Analysis]
Completed:            [list phases/features verified working, with how verified]
In Progress:          [what is partially built, exact file(s)]
Remaining:            [phases/features not started]
Current Errors:       [exact error messages/stack traces, or "none observed"]
Last Verification:    [what command/test was run, when, and result]
Next Action:          [the single next concrete step]
Files Changed:        [list of files touched this session]
Blockers:             [anything preventing progress, e.g. missing env var]
```

Only mark an item "Completed" after it was actually run and its output observed. Do not carry forward assumptions from a previous session — see `AGENT_CONTINUITY.md`.
