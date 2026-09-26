import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/diagnostic?studentId=xxx
// Returns diagnostic question pool (isDiagnostic=true, shuffled)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 })
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Fetch diagnostic questions with concept info
    const questions = await prisma.question.findMany({
      where: { isDiagnostic: true },
      include: { concept: { select: { id: true, name: true } } },
    })

    // Shuffle for variety
    const shuffled = questions.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      student: { id: student.id, name: student.name },
      questions: shuffled.map(q => ({
        id: q.id,
        conceptId: q.conceptId,
        conceptName: q.concept.name,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options as string[],
        // Do NOT send correctIndex to client
      })),
    })
  } catch (error: any) {
    console.error('[GET /api/diagnostic]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
