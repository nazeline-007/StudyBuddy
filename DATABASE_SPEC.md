# DATABASE_SPEC.md

PostgreSQL + Prisma. This document is detailed enough to write `schema.prisma` without additional decisions. Field lists are the *required minimum* — additional non-conflicting fields are allowed.

## 1. Enums

```prisma
enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}

enum MasteryStatus {
  STRONG        // >= 70
  DEVELOPING    // 40-69
  GAP           // < 40
}

enum AttemptType {
  DIAGNOSTIC
  QUIZ
}
```

## 2. Core Models

### Student
```prisma
model Student {
  id            String   @id @default(cuid())
  name          String
  createdAt     DateTime @default(now())

  attempts      AssessmentAttempt[]
  performances  StudentConceptPerformance[]
  learningPaths LearningPath[]
  quizAttempts  QuizAttempt[]
}
```

### Subject
```prisma
model Subject {
  id     String  @id @default(cuid())
  name   String  @unique   // "Data Structures" (single row for hackathon)
  topics Topic[]
}
```

### Topic
```prisma
model Topic {
  id        String    @id @default(cuid())
  name      String
  subjectId String
  subject   Subject   @relation(fields: [subjectId], references: [id])
  concepts  Concept[]
}
```
Topic is a light grouping layer above Concept (e.g. "Linear Structures" containing Arrays/Linked Lists/Stacks/Queues; "Tree Structures" containing Trees/Binary Trees/Tree Traversal). Optional to use meaningfully, but the model must exist and each Concept must reference one.

### Concept
```prisma
model Concept {
  id            String   @id @default(cuid())
  name          String   @unique   // one of the 7 fixed concepts
  topicId       String
  topic         Topic    @relation(fields: [topicId], references: [id])

  questions             Question[]
  performances          StudentConceptPerformance[]
  learningPathItems     LearningPathItem[]

  // prerequisite edges where THIS concept is the dependent (has prerequisites)
  prerequisiteOf        ConceptPrerequisite[] @relation("DependentConcept")
  // prerequisite edges where THIS concept is required BY others
  requiredFor           ConceptPrerequisite[] @relation("PrerequisiteConcept")
}
```

### ConceptPrerequisite
```prisma
model ConceptPrerequisite {
  id                  String  @id @default(cuid())
  conceptId           String  // the dependent concept (e.g. Binary Trees)
  prerequisiteId      String  // the required concept (e.g. Trees)

  concept             Concept @relation("DependentConcept", fields: [conceptId], references: [id])
  prerequisite        Concept @relation("PrerequisiteConcept", fields: [prerequisiteId], references: [id])

  @@unique([conceptId, prerequisiteId])
}
```
Required minimum edges (see PROJECT_SPEC.md §8):
Arrays→LinkedLists, LinkedLists→Stacks, LinkedLists→Queues, Trees→BinaryTrees, BinaryTrees→TreeTraversal.
Read direction: `prerequisite` must be satisfied before `concept`.

### Question
```prisma
model Question {
  id           String          @id @default(cuid())
  conceptId    String
  concept      Concept         @relation(fields: [conceptId], references: [id])
  difficulty   DifficultyLevel
  prompt       String
  options      Json            // array of strings, e.g. ["A", "B", "C", "D"]
  correctIndex Int             // index into options
  isDiagnostic Boolean         @default(false) // usable in diagnostic pool
  answers      Answer[]
}
```

### AssessmentAttempt
```prisma
model AssessmentAttempt {
  id             String      @id @default(cuid())
  studentId      String
  student        Student     @relation(fields: [studentId], references: [id])
  type           AttemptType // DIAGNOSTIC or QUIZ
  startedAt      DateTime    @default(now())
  completedAt    DateTime?
  overallScore   Float?      // percent, set on completion

  answers        Answer[]
}
```
Used for both the diagnostic and as the parent record for a quiz session (type = QUIZ). Per-question quiz-specific data (difficulty served) lives in `QuizAttempt`, which references the same `AssessmentAttempt` as its session.

### Answer
```prisma
model Answer {
  id                   String             @id @default(cuid())
  assessmentAttemptId  String
  assessmentAttempt    AssessmentAttempt  @relation(fields: [assessmentAttemptId], references: [id])
  questionId           String
  question             Question           @relation(fields: [questionId], references: [id])
  selectedIndex        Int
  isCorrect            Boolean
  answeredAt           DateTime           @default(now())
}
```

### QuizAttempt
```prisma
model QuizAttempt {
  id                   String             @id @default(cuid())
  studentId            String
  student              Student            @relation(fields: [studentId], references: [id])
  assessmentAttemptId  String             // links to the parent QUIZ AssessmentAttempt
  assessmentAttempt    AssessmentAttempt  @relation(fields: [assessmentAttemptId], references: [id])
  conceptId            String
  concept              Concept            @relation(fields: [conceptId], references: [id])
  questionId           String
  question             Question           @relation(fields: [questionId], references: [id])
  difficultyServed     DifficultyLevel
  isCorrect            Boolean
  sequenceIndex        Int                // order within the quiz session
  createdAt            DateTime           @default(now())
}
```
This is the record that proves adaptivity: `difficultyServed` per `sequenceIndex` must change based on `isCorrect` of prior rows in the same session.

### StudentConceptPerformance
```prisma
model StudentConceptPerformance {
  id                String        @id @default(cuid())
  studentId         String
  student           Student       @relation(fields: [studentId], references: [id])
  conceptId         String
  concept           Concept       @relation(fields: [conceptId], references: [id])

  masteryPercent    Float         @default(0)   // running value via formula
  status            MasteryStatus @default(GAP) // derived from masteryPercent
  lastScorePercent  Float?                       // most recent attempt score for this concept
  attemptsCount     Int           @default(0)
  updatedAt         DateTime      @updatedAt

  @@unique([studentId, conceptId])
}
```
`status` is recalculated (not independently editable) every time `masteryPercent` changes, using the fixed thresholds.

### LearningPath
```prisma
model LearningPath {
  id          String              @id @default(cuid())
  studentId   String
  student     Student             @relation(fields: [studentId], references: [id])
  generatedAt DateTime            @default(now())
  isCurrent   Boolean             @default(true) // only one current path per student

  items       LearningPathItem[]
}
```

### LearningPathItem
```prisma
model LearningPathItem {
  id              String        @id @default(cuid())
  learningPathId  String
  learningPath    LearningPath  @relation(fields: [learningPathId], references: [id])
  conceptId       String
  concept         Concept       @relation(fields: [conceptId], references: [id])
  orderIndex      Int           // 0-based priority order
  reason          String        // short human-readable justification, e.g. "Prerequisite gap: Trees"
}
```
`reason` is a plain string produced by the Path Generator (not the LLM) — e.g. `"Knowledge gap"`, `"Prerequisite gap for Binary Trees"`, `"Strong — optional review"`.

## 3. Relationship Summary

```
Student 1—* AssessmentAttempt 1—* Answer *—1 Question *—1 Concept
Student 1—* QuizAttempt *—1 Question, *—1 Concept, *—1 AssessmentAttempt(type=QUIZ)
Student 1—* StudentConceptPerformance *—1 Concept
Student 1—* LearningPath 1—* LearningPathItem *—1 Concept
Concept *—* Concept (via ConceptPrerequisite: concept ↔ prerequisite)
Subject 1—* Topic 1—* Concept 1—* Question
```

## 4. Prerequisite Structure Rules

- Directed edges only, no cycles.
- A concept can have more than one prerequisite (not required for the 7-concept set, but the schema supports it).
- Prerequisite check logic (implemented in application code, not DB): a concept is `prerequisiteBlocked` if any of its `prerequisite` concepts has `status != STRONG` in `StudentConceptPerformance` for that student.

## 5. Question Difficulty & Diagnostic Pool

- Every `Question.difficulty` is one of EASY/MEDIUM/HARD.
- Diagnostic pool = questions with `isDiagnostic = true`, spanning all 7 concepts and a mix of difficulties (recommend: 1–2 per concept, mixed difficulty, ~10–14 total).
- Adaptive quiz pool = all questions per concept, filtered by `difficultyServed` requested by the Adaptive Quiz Engine (TECHNICAL_ARCHITECTURE.md §6). Seed enough per concept/difficulty (recommend: ≥2 questions per concept per difficulty = 42 minimum) to avoid repeats within a session.

## 6. Indexes

Add explicit indexes for lookup paths used every request:

```prisma
@@index([studentId, conceptId]) // on StudentConceptPerformance (in addition to @@unique)
@@index([conceptId, difficulty]) // on Question
@@index([studentId, isCurrent])  // on LearningPath
@@index([assessmentAttemptId, sequenceIndex]) // on QuizAttempt
```

## 7. Seed Data Requirements

- 1 Subject ("Data Structures"), 2 Topics, 7 Concepts, prerequisite edges per §8 of PROJECT_SPEC.md.
- ≥14 diagnostic questions across all concepts/difficulties.
- ≥42 quiz questions (≥2 per concept per difficulty).
- 2 seeded demo students with pre-run diagnostic history so both a "strong performer" and "poor performer" `StudentConceptPerformance` state exist without live interaction, PLUS the ability for a judge to run a fresh diagnostic live. (One seeded strong, one seeded weak, plus a fresh "Student 3" for the live demo is sufficient — see IMPLEMENTATION_PLAN.md Phase 2.)
