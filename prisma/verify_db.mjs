// DB verification script — for session verification only, not part of the app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [
    conceptCount,
    prereqCount,
    diagQCount,
    totalQCount,
    studentCount,
    perfCount,
    subjectCount,
    topicCount,
    learningPathCount,
  ] = await Promise.all([
    prisma.concept.count(),
    prisma.conceptPrerequisite.count(),
    prisma.question.count({ where: { isDiagnostic: true } }),
    prisma.question.count(),
    prisma.student.count(),
    prisma.studentConceptPerformance.count(),
    prisma.subject.count(),
    prisma.topic.count(),
    prisma.learningPath.count(),
  ]);

  const concepts = await prisma.concept.findMany({ select: { name: true } });
  const students = await prisma.student.findMany({ select: { name: true, id: true } });
  const prereqs = await prisma.conceptPrerequisite.findMany({
    include: {
      concept: { select: { name: true } },
      prerequisite: { select: { name: true } },
    }
  });

  console.log('\n=== DATABASE VERIFICATION ===');
  console.log('Subjects:      ', subjectCount, '(expected: 1)');
  console.log('Topics:        ', topicCount, '(expected: 2)');
  console.log('Concepts:      ', conceptCount, '(expected: 7)');
  console.log('Concept names: ', concepts.map(c => c.name).join(', '));
  console.log('Prerequisites: ', prereqCount, '(expected: >=5)');
  console.log('Prereq edges:  ', prereqs.map(p => p.prerequisite.name + '->' + p.concept.name).join(', '));
  console.log('Diagnostic Qs: ', diagQCount, '(expected: >=14)');
  console.log('Total Qs:      ', totalQCount, '(expected: >=42)');
  console.log('Students:      ', studentCount, '(expected: >=2)');
  console.log('Student names: ', students.map(s => s.name).join(', '));
  console.log('Perf rows:     ', perfCount, '(expected: >=14)');
  console.log('Learning Paths:', learningPathCount);
  console.log('=== END VERIFICATION ===\n');

  // Per-concept question distribution
  const fullConcepts = await prisma.concept.findMany({ select: { id: true, name: true } });
  const idToName = Object.fromEntries(fullConcepts.map(c => [c.id, c.name]));
  const qByConceptDifficulty = await prisma.question.groupBy({
    by: ['conceptId', 'difficulty'],
    _count: true,
  });

  console.log('Per-concept question counts:');
  for (const row of qByConceptDifficulty) {
    console.log(' ', idToName[row.conceptId], '[' + row.difficulty + ']:', row._count);
  }

  // Performance data for seeded students
  for (const student of students) {
    const perfs = await prisma.studentConceptPerformance.findMany({
      where: { studentId: student.id },
      include: { concept: { select: { name: true } } }
    });
    console.log('\nStudent:', student.name);
    for (const p of perfs) {
      console.log(' ', p.concept.name + ': mastery=' + p.masteryPercent.toFixed(1) + '% status=' + p.status);
    }
  }
}

main()
  .catch(e => { console.error('DB ERROR:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
