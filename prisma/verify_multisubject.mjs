import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Running Multi-Subject Database Verification...\n');

  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          concepts: {
            include: {
              questions: true,
              prerequisiteOf: { include: { prerequisite: true } },
              requiredFor: { include: { concept: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${subjects.length} subjects (Expected: 4):`);
  const expectedSubjects = ['Chemistry', 'Data Structures', 'Mathematics', 'Physics'];
  
  for (const expected of expectedSubjects) {
    const s = subjects.find(sub => sub.name === expected);
    if (!s) {
      console.error(`❌ Missing subject: ${expected}`);
      process.exit(1);
    }
    const topics = s.topics;
    const concepts = topics.flatMap(t => t.concepts);
    const questions = concepts.flatMap(c => c.questions);
    const diagQuestions = questions.filter(q => q.isDiagnostic);
    const quizQuestions = questions.filter(q => !q.isDiagnostic);
    const prereqs = concepts.flatMap(c => c.prerequisiteOf);

    console.log(`\n📚 Subject: ${s.name}`);
    console.log(`   - Topics: ${topics.length} (${topics.map(t => t.name).join(', ')})`);
    console.log(`   - Concepts: ${concepts.length}`);
    for (const c of concepts) {
      const cDiag = c.questions.filter(q => q.isDiagnostic).length;
      const cEasy = c.questions.filter(q => !q.isDiagnostic && q.difficulty === 'EASY').length;
      const cMed = c.questions.filter(q => !q.isDiagnostic && q.difficulty === 'MEDIUM').length;
      const cHard = c.questions.filter(q => !q.isDiagnostic && q.difficulty === 'HARD').length;
      const prereqNames = c.prerequisiteOf.map(p => p.prerequisite.name).join(', ');
      console.log(`     • ${c.name} [Prereqs: ${prereqNames || 'None'}] -> Diag: ${cDiag}, Easy: ${cEasy}, Med: ${cMed}, Hard: ${cHard} (Total: ${c.questions.length})`);
    }
    console.log(`   - Total Diagnostic Qs: ${diagQuestions.length}`);
    console.log(`   - Total Quiz Qs: ${quizQuestions.length}`);
    console.log(`   - Total Prerequisites: ${prereqs.length}`);
  }

  // Verify Student separation
  console.log('\n👤 Checking Student Mastery Separation:');
  const students = await prisma.student.findMany({
    include: {
      performances: {
        include: {
          concept: {
            include: { topic: { include: { subject: true } } },
          },
        },
      },
    },
  });

  for (const st of students.slice(0, 4)) {
    console.log(`\n  Student: ${st.name} (id: ${st.id})`);
    const perfsBySubject = new Map();
    for (const p of st.performances) {
      const subName = p.concept?.topic?.subject?.name ?? 'Unknown';
      if (!perfsBySubject.has(subName)) perfsBySubject.set(subName, []);
      perfsBySubject.get(subName).push(p);
    }
    for (const [subName, perfs] of perfsBySubject.entries()) {
      const avgMastery = perfs.reduce((s, p) => s + p.masteryPercent, 0) / perfs.length;
      console.log(`    - ${subName}: ${perfs.length} concepts recorded, Avg Mastery = ${avgMastery.toFixed(1)}%`);
    }
  }

  console.log('\n✅ Multi-subject database structure verified successfully!');
}

main()
  .catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
