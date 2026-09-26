import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({ orderBy: { createdAt: 'desc' }, take: 8 })
  console.log('Recent students:', students.map(s => s.name + ' (' + s.id.substring(0,12) + ')').join(', '))

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { type: 'DIAGNOSTIC' },
    include: { student: true, answers: true },
    orderBy: { startedAt: 'desc' },
    take: 6
  })
  console.log('\nRecent DIAGNOSTIC attempts:')
  for (const a of attempts) {
    const correct = a.answers.filter(x => x.isCorrect).length
    console.log(`  ${a.student.name} | score=${a.overallScore?.toFixed(1)}% | answers=${a.answers.length} | correct=${correct}`)
  }

  const perfCount = await prisma.studentConceptPerformance.count()
  console.log('\nTotal performance rows:', perfCount)

  const pathCount = await prisma.learningPath.count()
  console.log('Total learning paths:', pathCount)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
