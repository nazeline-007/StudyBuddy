import { getAISupport } from '../lib/aiSupport.ts';

async function testAI() {
  console.log('🤖 Testing Gemini AI Support for Multi-Subject...\n');

  const testCases = [
    {
      concept: 'Linear Equations',
      subject: 'Mathematics',
      masteryPercent: 30,
      weakAreas: ['Quadratic Equations', 'Functions & Graphs'],
      recentScorePercent: 33,
      currentDifficulty: 'Easy',
      requestType: 'explanation',
    },
    {
      concept: 'Newton\'s Laws of Motion',
      subject: 'Physics',
      masteryPercent: 45,
      weakAreas: ['Work, Energy & Power'],
      recentScorePercent: 50,
      currentDifficulty: 'Medium',
      requestType: 'example',
    },
    {
      concept: 'Chemical Bonding & Molecular Structure',
      subject: 'Chemistry',
      masteryPercent: 75,
      weakAreas: [],
      recentScorePercent: 80,
      currentDifficulty: 'Hard',
      requestType: 'practice_question',
    },
  ];

  for (const tc of testCases) {
    console.log(`Testing ${tc.subject} - ${tc.concept} [${tc.requestType}]:`);
    const start = Date.now();
    const res = await getAISupport(tc);
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  -> Duration: ${duration}s | AI-generated: ${res.isAIGenerated} | Chars: ${res.content.length}`);
    if (res.error) console.log(`     Note: ${res.error}`);
    console.log(`     Preview: ${res.content.slice(0, 150).replace(/\n/g, ' ')}...\n`);
  }
}

testAI().catch(e => {
  console.error('AI test failed:', e);
});
