import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students?subjectId=xxx (optional)
// Lists students, optionally with their mastery for a specific subject
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        performances: {
          select: {
            masteryPercent: true,
            concept: {
              select: {
                topic: {
                  select: { subjectId: true },
                },
              },
            },
          },
        },
      },
    })

    const result = students.map(s => {
      // Filter performances by subject if given
      const relevantPerformances = subjectId
        ? s.performances.filter(p => p.concept?.topic?.subjectId === subjectId)
        : s.performances

      const hasPerformance = relevantPerformances.length > 0
      const overallMastery = hasPerformance
        ? relevantPerformances.reduce((sum, p) => sum + p.masteryPercent, 0) / relevantPerformances.length
        : null

      return {
        id: s.id,
        name: s.name,
        hasPerformance,
        overallMastery,
      }
    })

    return NextResponse.json({ students: result })
  } catch (error: any) {
    console.error('[GET /api/students]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/students — create a new student
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = (body.name ?? '').trim()

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const student = await prisma.student.create({ data: { name } })
    return NextResponse.json({ success: true, student })
  } catch (error: any) {
    console.error('[POST /api/students]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
