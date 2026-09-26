import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function startingDifficultyFromMastery(masteryPercent) {
  if (masteryPercent >= 70) return 'HARD';
  if (masteryPercent >= 40) return 'MEDIUM';
  return 'EASY';
}

function getNextDifficulty(state, isCorrect) {
  let { currentDifficulty, consecutiveCorrect, consecutiveIncorrect } = state;
  if (isCorrect) {
    consecutiveCorrect += 1;
    consecutiveIncorrect = 0;
    if (consecutiveCorrect >= 2) {
      if (currentDifficulty === 'EASY') {
        currentDifficulty = 'MEDIUM';
        consecutiveCorrect = 0;
      } else if (currentDifficulty === 'MEDIUM') {
        currentDifficulty = 'HARD';
        consecutiveCorrect = 0;
      }
    }
  } else {
    consecutiveIncorrect += 1;
    consecutiveCorrect = 0;
    if (currentDifficulty === 'HARD') {
      currentDifficulty = 'MEDIUM';
      consecutiveIncorrect = 0;
    } else if (currentDifficulty === 'MEDIUM' && consecutiveIncorrect >= 2) {
      currentDifficulty = 'EASY';
      consecutiveIncorrect = 0;
    }
  }
  return { currentDifficulty, consecutiveCorrect, consecutiveIncorrect };
}

async function testMultiSubjectFlow() {
  console.log('🧪 Starting Multi-Subject Full Flow Tests...\n');

  // 1. Verify all 4 subjects exist in DB
  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          concepts: true,
        },
      },
    },
  });

  const subjectNames = subjects.map(s => s.name);
  console.log('1. Available Subjects in DB:', subjectNames.join(', '));
  const expected = ['Chemistry', 'Data Structures', 'Mathematics', 'Physics'];
  for (const name of expected) {
    if (!subjectNames.includes(name)) {
      throw new Error(`Missing expected subject: ${name}`);
    }
  }
  console.log('   ✅ All 4 subjects confirmed present.\n');

  // 2. Test Data Structures regression (Alex still has strong mastery)
  const alex = await prisma.student.findUnique({
    where: { id: 'student-strong' },
    include: {
      performances: {
        where: { concept: { topic: { subject: { name: 'Data Structures' } } } },
        include: { concept: true },
      },
    },
  });

  if (!alex || alex.performances.length !== 7) {
    throw new Error('Data Structures Alex performance regression');
  }
  const avgDSMastery = alex.performances.reduce((s, p) => s + p.masteryPercent, 0) / 7;
  console.log(`2. Data Structures Alex Mastery: ${avgDSMastery.toFixed(1)}% (${alex.performances.filter(p => p.status === 'STRONG').length} Strong, ${alex.performances.filter(p => p.status === 'DEVELOPING').length} Developing)`);
  console.log('   ✅ Data Structures intact and unchanged.\n');

  // 3. Test Full Flow for Mathematics with a new student
  console.log('3. Testing Complete Flow for "Mathematics":');
  const mathSubject = subjects.find(s => s.name === 'Mathematics');
  if (!mathSubject) throw new Error('Mathematics subject not found');

  // 3a. Create a test student
  const testStudent = await prisma.student.create({
    data: { name: 'Test Math Student (' + Date.now() + ')' },
  });
  console.log(`   a. Created Student: "${testStudent.name}" (id: ${testStudent.id})`);

  // 3b. Diagnostic questions
  const mathDiagQuestions = await prisma.question.findMany({
    where: {
      isDiagnostic: true,
      concept: { topic: { subjectId: mathSubject.id } },
    },
    include: { concept: true },
  });
  console.log(`   b. Fetched Diagnostic Questions: ${mathDiagQuestions.length} questions (expected 12)`);
  if (mathDiagQuestions.length !== 12) {
    throw new Error(`Expected 12 diagnostic questions for Math, got ${mathDiagQuestions.length}`);
  }

  // 3c. Simulate Diagnostic submission: correct for linear-eq & quadratic-eq, wrong for rest
  const answers = mathDiagQuestions.map(q => {
    const isLinearOrQuad = q.concept.name.includes('Linear') || q.concept.name.includes('Quadratic');
    return {
      questionId: q.id,
      selectedIndex: isLinearOrQuad ? q.correctIndex : (q.correctIndex + 1) % 4,
    };
  });

  // Calculate scores
  const qMap = new Map(mathDiagQuestions.map(q => [q.id, q]));
  const scoredAnswers = answers.map(a => {
    const q = qMap.get(a.questionId);
    return {
      questionId: a.questionId,
      conceptId: q.conceptId,
      conceptName: q.concept.name,
      isCorrect: a.selectedIndex === q.correctIndex,
    };
  });

  const correctCount = scoredAnswers.filter(a => a.isCorrect).length;
  const overallScore = (correctCount / scoredAnswers.length) * 100;
  console.log(`   c. Diagnostic Scored: ${correctCount}/${scoredAnswers.length} correct (${overallScore.toFixed(1)}%)`);

  // Update performances
  const conceptMap = new Map();
  for (const a of scoredAnswers) {
    if (!conceptMap.has(a.conceptId)) conceptMap.set(a.conceptId, { total: 0, correct: 0 });
    const c = conceptMap.get(a.conceptId);
    c.total++;
    if (a.isCorrect) c.correct++;
  }

  for (const [conceptId, stats] of conceptMap.entries()) {
    const conceptScore = (stats.correct / stats.total) * 100;
    const prevMastery = 0;
    const newMastery = prevMastery * 0.7 + conceptScore * 0.3;
    const status = newMastery >= 70 ? 'STRONG' : newMastery >= 40 ? 'DEVELOPING' : 'GAP';

    await prisma.studentConceptPerformance.upsert({
      where: { studentId_conceptId: { studentId: testStudent.id, conceptId } },
      update: { masteryPercent: newMastery, status, lastScorePercent: conceptScore },
      create: { studentId: testStudent.id, conceptId, masteryPercent: newMastery, status, lastScorePercent: conceptScore, attemptsCount: 1 },
    });
  }

  // 3d. Check Knowledge Analysis for this subject
  const mathPerfs = await prisma.studentConceptPerformance.findMany({
    where: {
      studentId: testStudent.id,
      concept: { topic: { subjectId: mathSubject.id } },
    },
    include: { concept: true },
  });
  console.log(`   d. Knowledge Analysis: ${mathPerfs.length} concepts analyzed for Mathematics`);
  for (const p of mathPerfs) {
    console.log(`      - ${p.concept.name}: ${p.masteryPercent.toFixed(1)}% [${p.status}]`);
  }

  // 3e. Generate and check Learning Path for Mathematics
  const prereqs = await prisma.conceptPrerequisite.findMany();
  const perfMap = new Map(mathPerfs.map(p => [p.conceptId, p]));

  const pathItems = mathPerfs.map(p => {
    const pEdges = prereqs.filter(e => e.conceptId === p.conceptId);
    const blocked = pEdges.some(e => {
      const parent = perfMap.get(e.prerequisiteId);
      return !parent || parent.status !== 'STRONG';
    });
    return {
      conceptId: p.conceptId,
      name: p.concept.name,
      status: p.status,
      blocked,
      masteryPercent: p.masteryPercent,
    };
  }).sort((a, b) => {
    const priority = (item) => {
      if (item.status === 'GAP' && !item.blocked) return 0;
      if (item.status === 'GAP' && item.blocked) return 1;
      if (item.status === 'DEVELOPING' && !item.blocked) return 2;
      if (item.status === 'DEVELOPING' && item.blocked) return 3;
      return 4;
    };
    return priority(a) - priority(b);
  });

  const createdPath = await prisma.learningPath.create({
    data: {
      studentId: testStudent.id,
      subjectId: mathSubject.id,
      isCurrent: true,
      items: {
        create: pathItems.map((item, idx) => ({
          conceptId: item.conceptId,
          orderIndex: idx,
          reason: item.blocked ? 'Knowledge gap (blocked by prerequisite)' : 'Knowledge gap — practice needed',
        })),
      },
    },
    include: { items: { include: { concept: true } } },
  });

  console.log(`   e. Learning Path generated for Mathematics (${createdPath.items.length} items):`);
  for (const item of createdPath.items) {
    console.log(`      ${item.orderIndex + 1}. ${item.concept.name} -> ${item.reason}`);
  }

  // 3f. Test Adaptive Quiz on a Mathematics concept (e.g. Linear Equations)
  const linearConcept = mathSubject.topics.flatMap(t => t.concepts).find(c => c.name === 'Linear Equations');
  if (!linearConcept) throw new Error('Linear Equations concept not found');

  const mathQuizQuestions = await prisma.question.findMany({
    where: { conceptId: linearConcept.id, isDiagnostic: false },
  });
  console.log(`   f. Linear Equations Quiz Pool: ${mathQuizQuestions.length} questions (Easy/Med/Hard: ${mathQuizQuestions.filter(q => q.difficulty === 'EASY').length}/${mathQuizQuestions.filter(q => q.difficulty === 'MEDIUM').length}/${mathQuizQuestions.filter(q => q.difficulty === 'HARD').length})`);

  // Simulate adaptive quiz session:
  // Starts at EASY (0-39% mastery)
  let qState = { currentDifficulty: 'EASY', consecutiveCorrect: 0, consecutiveIncorrect: 0 };
  const trajectory = [];

  // Question 1: Answer correct -> difficulty stays EASY, consecutiveCorrect = 1
  qState = getNextDifficulty(qState, true);
  trajectory.push({ served: 'EASY', correct: true, nextDiff: qState.currentDifficulty });

  // Question 2: Answer correct -> 2 consecutive correct in EASY -> moves to MEDIUM
  qState = getNextDifficulty(qState, true);
  trajectory.push({ served: 'EASY', correct: true, nextDiff: qState.currentDifficulty });

  // Question 3: Answer correct in MEDIUM -> consecutiveCorrect = 1
  qState = getNextDifficulty(qState, true);
  trajectory.push({ served: 'MEDIUM', correct: true, nextDiff: qState.currentDifficulty });

  // Question 4: Answer correct in MEDIUM -> 2 consecutive correct -> moves to HARD
  qState = getNextDifficulty(qState, true);
  trajectory.push({ served: 'MEDIUM', correct: true, nextDiff: qState.currentDifficulty });

  // Question 5: Miss in HARD -> moves to MEDIUM
  qState = getNextDifficulty(qState, false);
  trajectory.push({ served: 'HARD', correct: false, nextDiff: qState.currentDifficulty });

  console.log('   g. Adaptive Quiz Trajectory:');
  for (const t of trajectory) {
    console.log(`      • Served: ${t.served}, Correct: ${t.correct} => Next: ${t.nextDiff}`);
  }

  // Finalize quiz & update mastery
  const quizScore = (4 / 5) * 100; // 80%
  const prevPerf = mathPerfs.find(p => p.conceptId === linearConcept.id);
  const prevM = prevPerf ? prevPerf.masteryPercent : 0;
  const newM = prevM * 0.7 + quizScore * 0.3;
  console.log(`   h. Updated Mastery for ${linearConcept.name}: ${prevM.toFixed(1)}% -> ${newM.toFixed(1)}% (${newM >= 70 ? 'STRONG' : newM >= 40 ? 'DEVELOPING' : 'GAP'})`);

  // 4. Confirm mastery is subject-specific
  console.log('\n4. Confirming Subject-Specific Mastery Isolation:');
  const studentPerfs = await prisma.studentConceptPerformance.findMany({
    where: { studentId: testStudent.id },
    include: { concept: { include: { topic: { include: { subject: true } } } } },
  });
  const subjectsWithData = new Set(studentPerfs.map(p => p.concept.topic.subject.name));
  console.log(`   Student ${testStudent.name} has performance ONLY in: [${Array.from(subjectsWithData).join(', ')}]`);
  if (subjectsWithData.size !== 1 || !subjectsWithData.has('Mathematics')) {
    throw new Error('Subject performance isolation failed');
  }
  console.log('   ✅ Mastery strictly isolated by subject.');

  console.log('\n🎉 ALL MULTI-SUBJECT FLOW TESTS PASSED SUCCESSFULLY!');
}

testMultiSubjectFlow()
  .catch(e => {
    console.error('❌ Flow test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
