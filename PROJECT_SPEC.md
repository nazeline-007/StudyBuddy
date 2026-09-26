# PROJECT_SPEC.md — Adaptive AI-Powered Personalized Learning Platform

Source of truth for product scope. If any other document conflicts with this file, this file wins.

## 1. Problem

Students have different skill levels and knowledge gaps, but most platforms deliver identical content and assessments to everyone. This project builds a platform that evaluates a student's existing knowledge, detects gaps and prerequisite weaknesses, and adapts content and quiz difficulty per student.

## 2. Goal

Demonstrate a working, end-to-end adaptive learning loop for one subject, built in a 5-hour hackathon window, with real (not simulated) data-driven adaptivity.

## 3. Subject Scope (fixed, do not expand)

**Subject:** Data Structures
**Concepts (exactly these seven):**
1. Arrays
2. Linked Lists
3. Stacks
4. Queues
5. Trees
6. Binary Trees
7. Tree Traversal

No other subjects, concepts, or topics may be added.

## 4. Core Learning Cycle (mandatory, fixed order)

```
Assessment → Knowledge Analysis → Personalized Learning → Adaptive Quiz → Updated Recommendations
```

Every feature must serve this cycle. The cycle must be able to repeat: taking a quiz updates the profile, which updates the path, which can be re-entered.

## 5. Required Features

1. **Diagnostic Assessment** — multi-concept question set, records answers, computes overall + per-concept performance, persists attempt, creates initial learning profile.
2. **Performance Tracking** — persisted overall performance, per-concept mastery, strengths, weaknesses, recent performance, stored in PostgreSQL.
3. **Knowledge Gap Detection** — deterministic thresholds (see below), no AI involvement.
4. **Prerequisites** — real DB relationships among the seven concepts that measurably affect path ordering.
5. **Personalized Learning Path** — generated from actual stored mastery data; regenerates after new performance; must differ across different student performance profiles.
6. **Adaptive Quiz** — difficulty changes based on the student's actual answers during the quiz (not simulated).
7. **AI Learning Support** — one LLM used only for explanations/examples/practice questions, using real student context.
8. **Continuous Learning Profile** — every assessment/quiz updates mastery, gaps, prerequisites status, and recommendations.

## 6. Knowledge Gap Thresholds (fixed, deterministic)

- **≥ 70%** → Strong
- **40–69%** → Developing
- **< 40%** → Knowledge Gap

These thresholds are used everywhere mastery is classified. Do not vary them per feature.

## 7. Mastery Update Formula (fixed)

```
newMastery = previousMastery × 0.7 + currentPerformance × 0.3
```

Applied after every assessment attempt and every quiz attempt, per concept touched. New student's initial mastery = diagnostic performance for that concept (previousMastery treated as 0 or as the diagnostic score itself — see TECHNICAL_ARCHITECTURE.md §5).

## 8. Prerequisite Relationships (minimum required set)

- Arrays → Linked Lists
- Linked Lists → Stacks
- Linked Lists → Queues
- Trees → Binary Trees
- Binary Trees → Tree Traversal

Additional sensible edges among the seven concepts are allowed but not required. Full rules in DATABASE_SPEC.md §4 and TECHNICAL_ARCHITECTURE.md §6.

## 9. Required Screens (exactly these seven, no more)

1. Start
2. Diagnostic Assessment
3. Knowledge Analysis
4. Personalized Learning Path
5. Learning Support
6. Adaptive Quiz
7. Updated Recommendations

## 10. Explicitly Out of Scope

Gamification, leaderboards, badges, certificates, social features, teacher/parent dashboards, payments, marketplace, attendance, notifications, general-purpose chatbot, multiple subjects, mobile app, geolocation, unrelated analytics, any AI feature beyond §5's three uses, any screen beyond the seven listed above.

## 11. Acceptance Criteria

The build is considered functionally complete when a judge can, without manual DB edits:

1. Start a diagnostic assessment and answer questions spanning all 7 concepts.
2. See computed overall and per-concept performance persisted to PostgreSQL.
3. See a Knowledge Analysis screen showing strengths, weaknesses, and knowledge gaps using the fixed thresholds.
4. See a Personalized Learning Path that visibly prioritizes weak prerequisite concepts over their dependents.
5. Open a concept and receive an AI-generated explanation/example/practice question using that student's real mastery/weakness context.
6. Take an Adaptive Quiz where difficulty visibly increases after correct answers and decreases after incorrect answers.
7. See mastery values update after the quiz using the fixed formula.
8. See Updated Recommendations reflect the new mastery (different from before the quiz).
9. Repeat steps 1–8 with a second, differently-performing student and observe a **different** learning path and different adaptive quiz trajectory (proves no hardcoded path).
10. If the LLM API fails, the app continues functioning with fallback content — no crash, no blocked flow.

## 12. Demo Data Requirement

Seed data must support both a "strong performer" and "poor performer" demo scenario without any manual database editing during the demo. See DATABASE_SPEC.md §7 and IMPLEMENTATION_PLAN.md Phase 2.
