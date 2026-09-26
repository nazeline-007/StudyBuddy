import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students — list all students with performance summary
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        performances: {
          select: { masteryPercent: true },
        },
      },
    })

    const result = students.map(s => {
      const hasPerformance = s.performances.length > 0
      const overallMastery = hasPerformance
        ? s.performances.reduce((sum, p) => sum + p.masteryPercent, 0) / s.performances.length
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
