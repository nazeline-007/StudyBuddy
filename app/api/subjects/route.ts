import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/subjects
// Returns all subjects with their topic/concept structure
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          include: {
            concepts: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      subjects: subjects.map(s => ({
        id: s.id,
        name: s.name,
        conceptCount: s.topics.reduce((sum, t) => sum + t.concepts.length, 0),
        concepts: s.topics.flatMap(t => t.concepts),
      })),
    })
  } catch (error: any) {
    console.error('[GET /api/subjects]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
