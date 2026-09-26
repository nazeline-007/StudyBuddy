// Phase 4 Verification Script — Knowledge Analysis API
// Tests: all 7 concepts returned, correct mastery/status, prerequisite blocking
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  \u2705', message);
    passed++;
  } else {
    console.error('  \u274c FAIL:', message);
    failed++;
  }
}

async function getAnalysis(studentId) {
  const res = await fetch(`${BASE}/api/analysis?studentId=${studentId}`);
  return res.json();
}

async function main() {
  console.log('\n=== Phase 4 Verification: Knowledge Analysis API ===\n');

  const students = await prisma.student.findMany({
    where: { name: { in: ['Alex (Strong Demo)', 'Jordan (Weak Demo)'] } },
    select: { id: true, name: true },
  });

  const alex = students.find(s => s.name === 'Alex (Strong Demo)');
  const jordan = students.find(s => s.name === 'Jordan (Weak Demo)');

  if (!alex || !jordan) {
    console.error('Could not find Alex or Jordan. Found:', students.map(s => s.name));
    process.exit(1);
  }

  console.log(`Alex ID:   ${alex.id}`);
  console.log(`Jordan ID: ${jordan.id}\n`);

  // Test 1: Missing studentId
  console.log('--- Test 1: Missing studentId -> 400 ---');
  const r1 = await fetch(`${BASE}/api/analysis`);
  assert(r1.status === 400, 'Returns 400 when studentId missing');

  // Test 2: Invalid studentId
  console.log('\n--- Test 2: Nonexistent studentId -> 404 ---');
  const r2 = await getAnalysis('nonexistent-id-xyz');
  assert(r2.error === 'Student not found', 'Returns "Student not found" error');

  // Test 3: Alex (Strong)
  console.log('\n--- Test 3: Alex (Strong Demo) ---');
  const alexData = await getAnalysis(alex.id);
  assert(!alexData.error, 'No error for Alex');
  assert(alexData.student?.name === 'Alex (Strong Demo)', 'Student name is Alex (Strong Demo)');
  assert(Array.isArray(alexData.performances), 'performances is an array');
  assert(alexData.performances.length === 7, `Returns all 7 concepts (got ${alexData.performances.length})`);

  const alexPerfs = alexData.performances;
  const alexArrays = alexPerfs.find(p => p.conceptName === 'Arrays');
  assert(alexArrays !== undefined, 'Arrays concept present');
  assert(Math.abs(alexArrays.masteryPercent - 88.2) < 0.15, `Arrays mastery ~88.2% (got ${alexArrays?.masteryPercent})`);
  assert(alexArrays.status === 'STRONG', `Arrays status=STRONG (got ${alexArrays?.status})`);

  const alexTreeTraversal = alexPerfs.find(p => p.conceptName === 'Tree Traversal');
  assert(alexTreeTraversal !== undefined, 'Tree Traversal concept present');
  assert(Math.abs(alexTreeTraversal.masteryPercent - 68.8) < 0.15, `Tree Traversal mastery ~68.8% (got ${alexTreeTraversal?.masteryPercent})`);
  assert(alexTreeTraversal.status === 'DEVELOPING', `Tree Traversal status=DEVELOPING (got ${alexTreeTraversal?.status})`);

  assert(alexPerfs.every(p => typeof p.prerequisiteBlocked === 'boolean'), 'All perfs have prerequisiteBlocked boolean');
  assert(alexPerfs.every(p => Array.isArray(p.blockedByNames)), 'All perfs have blockedByNames array');

  const alexBlocked = alexPerfs.filter(p => p.prerequisiteBlocked);
  assert(alexBlocked.length === 0, `Alex: 0 prerequisite-blocked concepts (got ${alexBlocked.length}: ${alexBlocked.map(p => p.conceptName).join(', ')})`);

  assert(alexData.summary.strongCount === 6, `Alex: 6 STRONG (got ${alexData.summary.strongCount})`);
  assert(alexData.summary.developingCount === 1, `Alex: 1 DEVELOPING (got ${alexData.summary.developingCount})`);
  assert(alexData.summary.gapCount === 0, `Alex: 0 GAP (got ${alexData.summary.gapCount})`);

  // Test 4: Jordan (Weak)
  console.log('\n--- Test 4: Jordan (Weak Demo) ---');
  const jordanData = await getAnalysis(jordan.id);
  assert(!jordanData.error, 'No error for Jordan');
  assert(jordanData.student?.name === 'Jordan (Weak Demo)', 'Student name is Jordan (Weak Demo)');
  assert(jordanData.performances.length === 7, `Returns all 7 concepts (got ${jordanData.performances.length})`);

  const jordanPerfs = jordanData.performances;
  const jordanArrays = jordanPerfs.find(p => p.conceptName === 'Arrays');
  assert(Math.abs(jordanArrays.masteryPercent - 19.5) < 0.15, `Arrays mastery ~19.5% (got ${jordanArrays?.masteryPercent})`);
  assert(jordanArrays.status === 'GAP', `Arrays status=GAP (got ${jordanArrays?.status})`);

  const jordanLL = jordanPerfs.find(p => p.conceptName === 'Linked Lists');
  assert(jordanLL.prerequisiteBlocked === true, 'Linked Lists is prerequisite-blocked (Arrays is GAP)');
  assert(jordanLL.blockedByNames.includes('Arrays'), `Linked Lists blockedByNames includes "Arrays" (got ${JSON.stringify(jordanLL.blockedByNames)})`);

  const jordanStacks = jordanPerfs.find(p => p.conceptName === 'Stacks');
  assert(jordanStacks.prerequisiteBlocked === true, 'Stacks is prerequisite-blocked (Linked Lists is GAP)');
  assert(jordanStacks.blockedByNames.includes('Linked Lists'), 'Stacks blockedByNames includes "Linked Lists"');

  const jordanQueues = jordanPerfs.find(p => p.conceptName === 'Queues');
  assert(jordanQueues.prerequisiteBlocked === true, 'Queues is prerequisite-blocked (Linked Lists is GAP)');

  const jordanBT = jordanPerfs.find(p => p.conceptName === 'Binary Trees');
  assert(jordanBT.prerequisiteBlocked === true, 'Binary Trees is prerequisite-blocked (Trees is GAP)');

  const jordanTT = jordanPerfs.find(p => p.conceptName === 'Tree Traversal');
  assert(jordanTT.prerequisiteBlocked === true, 'Tree Traversal is prerequisite-blocked (Binary Trees is GAP)');

  assert(jordanArrays.prerequisiteBlocked === false, 'Arrays is NOT blocked (no prerequisites)');
  const jordanTrees = jordanPerfs.find(p => p.conceptName === 'Trees');
  assert(jordanTrees.prerequisiteBlocked === false, 'Trees is NOT blocked (no prerequisites)');

  assert(jordanData.summary.gapCount === 7, `Jordan: 7 GAP (got ${jordanData.summary.gapCount})`);
  assert(jordanData.summary.strongCount === 0, `Jordan: 0 STRONG (got ${jordanData.summary.strongCount})`);

  // Test 5: Outputs differ
  console.log('\n--- Test 5: Alex and Jordan outputs differ ---');
  assert(alexData.overallMastery !== jordanData.overallMastery, 'Overall mastery differs between students');
  assert(alexData.summary.strongCount > jordanData.summary.strongCount, 'Alex has more STRONG concepts than Jordan');
  assert(jordanData.summary.gapCount > alexData.summary.gapCount, 'Jordan has more GAP concepts than Alex');

  const alexBlockedCount = alexPerfs.filter(p => p.prerequisiteBlocked).length;
  const jordanBlockedCount = jordanPerfs.filter(p => p.prerequisiteBlocked).length;
  assert(jordanBlockedCount > alexBlockedCount, `Jordan has more blocked concepts than Alex (${jordanBlockedCount} vs ${alexBlockedCount})`);

  console.log('\n=== RESULTS ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed === 0) {
    console.log('\u2705 ALL PHASE 4 API CHECKS PASSED');
  } else {
    console.log('\u274c SOME CHECKS FAILED - see above');
    process.exit(1);
  }
}

main()
  .catch(e => { console.error('Script error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
