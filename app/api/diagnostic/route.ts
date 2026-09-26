import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/diagnostic?studentId=xxx&subjectId=xxx
// Returns diagnostic question pool (isDiagnostic=true), scoped to the given subject.
// subjectId is required so questions are filtered to that subject only.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const subjectId = searchParams.get('subjectId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 })
    }
    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId required' }, { status: 400 })
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Fetch diagnostic questions filtered by subject (via topic → subject join)
    const questions = await prisma.question.findMany({
      where: {
        isDiagnostic: true,
        concept: {
          topic: { subjectId },
        },
      },
      include: { concept: { select: { id: true, name: true } } },
    })

    if (questions.length === 0) {
      return NextResponse.json(
        { error: `No diagnostic questions found for subject "${subject.name}"` },
        { status: 404 }
      )
    }

    // Shuffle for variety
    const shuffled = questions.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      student: { id: student.id, name: student.name },
      subject: { id: subject.id, name: subject.name },
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
