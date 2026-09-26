import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Read API key safely from .env.local
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  try {
    const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
    const match = envLocal.match(/GEMINI_API_KEY\s*=\s*(.+)/);
    if (match) {
      apiKey = match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch {}
}

async function testGeminiMultiSubject() {
  console.log('🤖 Testing Gemini API for Mathematics, Physics, Chemistry...\n');

  if (!apiKey) {
    console.log('No GEMINI_API_KEY found. Static fallback will be used in app.');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
    systemInstruction: 'You are an expert tutor. Provide concise, high-quality, structured explanations with markdown formatting.',
  });

  const prompts = [
    { subject: 'Mathematics', topic: 'Linear Equations', prompt: 'Explain the concept of Linear Equations with slope-intercept form for a beginner student.' },
    { subject: 'Physics', topic: 'Newton\'s Laws', prompt: 'Provide a real-world worked example of Newton\'s Second Law of Motion (F=ma).' },
    { subject: 'Chemistry', topic: 'Chemical Bonding', prompt: 'Provide a challenging practice problem about covalent vs ionic bonding with a hint.' },
  ];

  for (const p of prompts) {
    console.log(`Sending prompt for ${p.subject} (${p.topic})...`);
    const start = Date.now();
    const result = await model.generateContent(p.prompt);
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    const text = result.response.text();
    console.log(`  ✅ Received in ${duration}s (${text.length} chars)`);
    console.log(`  Preview: ${text.slice(0, 120).replace(/\n/g, ' ')}...\n`);
  }

  console.log('🎉 Gemini multi-subject API calls succeeded!');
}

testGeminiMultiSubject().catch(e => {
  console.error('Gemini test error:', e.message);
});
