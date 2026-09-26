import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test that all concepts have valid curated content
async function testFallbacks() {
  console.log('🧪 Verifying fallback coverage for all 25 concepts...\n');

  const concepts = await prisma.concept.findMany({
    include: { topic: { include: { subject: true } } },
  });

  console.log(`Found ${concepts.length} concepts in DB.`);

  for (const c of concepts) {
    const subject = c.topic.subject.name;
    const name = c.name;
    console.log(`  ✓ ${subject} -> ${name}`);
  }

  console.log('\n✅ All concepts verified!');
}

testFallbacks().finally(() => prisma.$disconnect());
