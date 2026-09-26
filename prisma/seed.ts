import { PrismaClient, DifficultyLevel, MasteryStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Helper: compute mastery status from percent
function computeStatus(percent: number): MasteryStatus {
  if (percent >= 70) return 'STRONG'
  if (percent >= 40) return 'DEVELOPING'
  return 'GAP'
}

// Helper: apply mastery formula
// newMastery = previousMastery * 0.7 + currentPerformance * 0.3
function applyMasteryFormula(prev: number, current: number): number {
  return prev * 0.7 + current * 0.3
}

async function main() {
  console.log('🌱 Seeding database with Multi-Subject support...')

  // ============================================================
  // 1. DATA STRUCTURES (Existing — preserved exactly)
  // ============================================================
  const dsSubject = await prisma.subject.upsert({
    where: { name: 'Data Structures' },
    update: {},
    create: { name: 'Data Structures' },
  })

  const linearTopic = await prisma.topic.upsert({
    where: { id: 'topic-linear' },
    update: {},
    create: { id: 'topic-linear', name: 'Linear Structures', subjectId: dsSubject.id },
  })

  const treeTopic = await prisma.topic.upsert({
    where: { id: 'topic-tree' },
    update: {},
    create: { id: 'topic-tree', name: 'Tree Structures', subjectId: dsSubject.id },
  })

  const dsConceptData = [
    { id: 'c-arrays',        name: 'Arrays',         topicId: linearTopic.id },
    { id: 'c-linkedlists',   name: 'Linked Lists',   topicId: linearTopic.id },
    { id: 'c-stacks',        name: 'Stacks',         topicId: linearTopic.id },
    { id: 'c-queues',        name: 'Queues',         topicId: linearTopic.id },
    { id: 'c-trees',         name: 'Trees',          topicId: treeTopic.id },
    { id: 'c-binarytrees',   name: 'Binary Trees',   topicId: treeTopic.id },
    { id: 'c-traversal',     name: 'Tree Traversal', topicId: treeTopic.id },
  ]

  for (const c of dsConceptData) {
    await prisma.concept.upsert({
      where: { id: c.id },
      update: { name: c.name, topicId: c.topicId },
      create: c,
    })
  }

  const dsPrereqEdges = [
    { conceptId: 'c-linkedlists', prerequisiteId: 'c-arrays' },
    { conceptId: 'c-stacks',      prerequisiteId: 'c-linkedlists' },
    { conceptId: 'c-queues',      prerequisiteId: 'c-linkedlists' },
    { conceptId: 'c-binarytrees', prerequisiteId: 'c-trees' },
    { conceptId: 'c-traversal',   prerequisiteId: 'c-binarytrees' },
  ]

  for (const edge of dsPrereqEdges) {
    await prisma.conceptPrerequisite.upsert({
      where: { conceptId_prerequisiteId: edge },
      update: {},
      create: { id: `prereq-${edge.conceptId}-${edge.prerequisiteId}`, ...edge },
    })
  }

  // ============================================================
  // 2. MATHEMATICS
  // ============================================================
  const mathSubject = await prisma.subject.upsert({
    where: { name: 'Mathematics' },
    update: {},
    create: { name: 'Mathematics' },
  })

  const mathAlgebraTopic = await prisma.topic.upsert({
    where: { id: 'topic-math-algebra' },
    update: {},
    create: { id: 'topic-math-algebra', name: 'Algebra & Functions', subjectId: mathSubject.id },
  })

  const mathCalculusTopic = await prisma.topic.upsert({
    where: { id: 'topic-math-calculus' },
    update: {},
    create: { id: 'topic-math-calculus', name: 'Calculus & Analysis', subjectId: mathSubject.id },
  })

  const mathConceptData = [
    { id: 'c-math-linear-eq',    name: 'Linear Equations',              topicId: mathAlgebraTopic.id },
    { id: 'c-math-quadratic-eq', name: 'Quadratic Equations',           topicId: mathAlgebraTopic.id },
    { id: 'c-math-functions',    name: 'Functions & Graphs',            topicId: mathAlgebraTopic.id },
    { id: 'c-math-limits',       name: 'Limits & Continuity',           topicId: mathCalculusTopic.id },
    { id: 'c-math-derivatives',  name: 'Derivatives & Differentiation', topicId: mathCalculusTopic.id },
    { id: 'c-math-integrals',    name: 'Definite & Indefinite Integrals', topicId: mathCalculusTopic.id },
  ]

  for (const c of mathConceptData) {
    await prisma.concept.upsert({
      where: { id: c.id },
      update: { name: c.name, topicId: c.topicId },
      create: c,
    })
  }

  const mathPrereqEdges = [
    { conceptId: 'c-math-quadratic-eq', prerequisiteId: 'c-math-linear-eq' },
    { conceptId: 'c-math-functions',    prerequisiteId: 'c-math-quadratic-eq' },
    { conceptId: 'c-math-limits',       prerequisiteId: 'c-math-functions' },
    { conceptId: 'c-math-derivatives',  prerequisiteId: 'c-math-limits' },
    { conceptId: 'c-math-integrals',    prerequisiteId: 'c-math-derivatives' },
  ]

  for (const edge of mathPrereqEdges) {
    await prisma.conceptPrerequisite.upsert({
      where: { conceptId_prerequisiteId: edge },
      update: {},
      create: { id: `prereq-${edge.conceptId}-${edge.prerequisiteId}`, ...edge },
    })
  }

  // ============================================================
  // 3. PHYSICS
  // ============================================================
  const physSubject = await prisma.subject.upsert({
    where: { name: 'Physics' },
    update: {},
    create: { name: 'Physics' },
  })

  const physMechanicsTopic = await prisma.topic.upsert({
    where: { id: 'topic-phys-mechanics' },
    update: {},
    create: { id: 'topic-phys-mechanics', name: 'Classical Mechanics', subjectId: physSubject.id },
  })

  const physWavesTopic = await prisma.topic.upsert({
    where: { id: 'topic-phys-thermo-waves' },
    update: {},
    create: { id: 'topic-phys-thermo-waves', name: 'Thermodynamics & Waves', subjectId: physSubject.id },
  })

  const physConceptData = [
    { id: 'c-phys-kinematics',    name: 'Kinematics & Motion',            topicId: physMechanicsTopic.id },
    { id: 'c-phys-newtons-laws',  name: 'Newton\'s Laws of Motion',       topicId: physMechanicsTopic.id },
    { id: 'c-phys-work-energy',   name: 'Work, Energy & Power',           topicId: physMechanicsTopic.id },
    { id: 'c-phys-momentum',      name: 'Linear Momentum & Collisions',   topicId: physMechanicsTopic.id },
    { id: 'c-phys-thermo',        name: 'Laws of Thermodynamics',         topicId: physWavesTopic.id },
    { id: 'c-phys-waves-sound',   name: 'Wave Motion & Sound',            topicId: physWavesTopic.id },
  ]

  for (const c of physConceptData) {
    await prisma.concept.upsert({
      where: { id: c.id },
      update: { name: c.name, topicId: c.topicId },
      create: c,
    })
  }

  const physPrereqEdges = [
    { conceptId: 'c-phys-newtons-laws', prerequisiteId: 'c-phys-kinematics' },
    { conceptId: 'c-phys-work-energy',  prerequisiteId: 'c-phys-newtons-laws' },
    { conceptId: 'c-phys-momentum',     prerequisiteId: 'c-phys-newtons-laws' },
    { conceptId: 'c-phys-thermo',       prerequisiteId: 'c-phys-work-energy' },
    { conceptId: 'c-phys-waves-sound',  prerequisiteId: 'c-phys-kinematics' },
  ]

  for (const edge of physPrereqEdges) {
    await prisma.conceptPrerequisite.upsert({
      where: { conceptId_prerequisiteId: edge },
      update: {},
      create: { id: `prereq-${edge.conceptId}-${edge.prerequisiteId}`, ...edge },
    })
  }

  // ============================================================
  // 4. CHEMISTRY
  // ============================================================
  const chemSubject = await prisma.subject.upsert({
    where: { name: 'Chemistry' },
    update: {},
    create: { name: 'Chemistry' },
  })

  const chemAtomicTopic = await prisma.topic.upsert({
    where: { id: 'topic-chem-atomic' },
    update: {},
    create: { id: 'topic-chem-atomic', name: 'Atomic Structure & Bonding', subjectId: chemSubject.id },
  })

  const chemReactionsTopic = await prisma.topic.upsert({
    where: { id: 'topic-chem-reactions' },
    update: {},
    create: { id: 'topic-chem-reactions', name: 'Reactions & Kinetics', subjectId: chemSubject.id },
  })

  const chemConceptData = [
    { id: 'c-chem-atomic-struct', name: 'Atomic Structure & Isotopes',            topicId: chemAtomicTopic.id },
    { id: 'c-chem-periodic-table', name: 'Periodic Trends & Elements',            topicId: chemAtomicTopic.id },
    { id: 'c-chem-bonding',        name: 'Chemical Bonding & Molecular Structure', topicId: chemAtomicTopic.id },
    { id: 'c-chem-stoichiometry',  name: 'Chemical Formulas & Stoichiometry',     topicId: chemReactionsTopic.id },
    { id: 'c-chem-reactions',      name: 'Types of Chemical Reactions',           topicId: chemReactionsTopic.id },
    { id: 'c-chem-acids-bases',    name: 'Acids, Bases & pH',                     topicId: chemReactionsTopic.id },
  ]

  for (const c of chemConceptData) {
    await prisma.concept.upsert({
      where: { id: c.id },
      update: { name: c.name, topicId: c.topicId },
      create: c,
    })
  }

  const chemPrereqEdges = [
    { conceptId: 'c-chem-periodic-table', prerequisiteId: 'c-chem-atomic-struct' },
    { conceptId: 'c-chem-bonding',        prerequisiteId: 'c-chem-periodic-table' },
    { conceptId: 'c-chem-stoichiometry',  prerequisiteId: 'c-chem-atomic-struct' },
    { conceptId: 'c-chem-reactions',      prerequisiteId: 'c-chem-bonding' },
    { conceptId: 'c-chem-acids-bases',    prerequisiteId: 'c-chem-reactions' },
  ]

  for (const edge of chemPrereqEdges) {
    await prisma.conceptPrerequisite.upsert({
      where: { conceptId_prerequisiteId: edge },
      update: {},
      create: { id: `prereq-${edge.conceptId}-${edge.prerequisiteId}`, ...edge },
    })
  }

  // ============================================================
  // 5. ALL QUESTIONS
  // ============================================================
  const allQuestions = [
    // ------------------------------------------------------------
    // DATA STRUCTURES QUESTIONS (Preserved)
    // ------------------------------------------------------------
    // Arrays
    {
      id: 'q-arr-d1', conceptId: 'c-arrays', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the time complexity of accessing an element by index in an array?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctIndex: 2,
    },
    {
      id: 'q-arr-d2', conceptId: 'c-arrays', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Which of the following is true about arrays in most programming languages?',
      options: ['Arrays can grow dynamically without any overhead', 'Arrays store elements in contiguous memory locations', 'Array elements must all be of different types', 'Arrays do not support index-based access'],
      correctIndex: 1,
    },
    {
      id: 'q-arr-e1', conceptId: 'c-arrays', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the index of the first element in a zero-indexed array?',
      options: ['1', '0', '-1', 'Depends on the language'], correctIndex: 1,
    },
    {
      id: 'q-arr-e2', conceptId: 'c-arrays', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which operation on an array has O(n) time complexity in the worst case?',
      options: ['Accessing an element by index', 'Finding the length', 'Inserting at the beginning', 'Reading the last element'],
      correctIndex: 2,
    },
    {
      id: 'q-arr-m1', conceptId: 'c-arrays', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What happens when you insert an element at the beginning of an array?',
      options: ['All elements shift right by one position', 'The array automatically resizes', 'Only the first element is replaced', 'Nothing — arrays are immutable'],
      correctIndex: 0,
    },
    {
      id: 'q-arr-m2', conceptId: 'c-arrays', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A 2D array of size m×n stores how many elements total?',
      options: ['m + n', 'm × n', 'm² + n²', '2(m + n)'], correctIndex: 1,
    },
    {
      id: 'q-arr-h1', conceptId: 'c-arrays', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In a sorted array of n elements, binary search requires at most how many comparisons?',
      options: ['n', 'n/2', 'log₂(n) + 1', 'n²'], correctIndex: 2,
    },
    {
      id: 'q-arr-h2', conceptId: 'c-arrays', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which sorting algorithm has O(n²) worst-case but O(n log n) average-case complexity?',
      options: ['Merge Sort', 'Bubble Sort', 'Quick Sort', 'Insertion Sort'], correctIndex: 2,
    },

    // Linked Lists
    {
      id: 'q-ll-d1', conceptId: 'c-linkedlists', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What does each node in a singly linked list contain?',
      options: ['Only data', 'Data and a pointer to the next node', 'Data and pointers to both next and previous nodes', 'Only a pointer to the next node'],
      correctIndex: 1,
    },
    {
      id: 'q-ll-d2', conceptId: 'c-linkedlists', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the time complexity of searching for an element in an unsorted linked list?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctIndex: 2,
    },
    {
      id: 'q-ll-e1', conceptId: 'c-linkedlists', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which node in a linked list holds a null pointer?',
      options: ['Head', 'Middle', 'Tail', 'All nodes'], correctIndex: 2,
    },
    {
      id: 'q-ll-e2', conceptId: 'c-linkedlists', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A doubly linked list node has pointers to:',
      options: ['Next only', 'Previous only', 'Both next and previous', 'Neither'], correctIndex: 2,
    },
    {
      id: 'q-ll-m1', conceptId: 'c-linkedlists', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Inserting a node at the head of a singly linked list is:',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctIndex: 2,
    },
    {
      id: 'q-ll-m2', conceptId: 'c-linkedlists', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'To delete the kth node in a singly linked list, you need access to:',
      options: ['The kth node only', 'The (k-1)th node', 'The head only', 'All nodes'], correctIndex: 1,
    },
    {
      id: 'q-ll-h1', conceptId: 'c-linkedlists', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Floyd\'s cycle detection algorithm uses:',
      options: ['Two pointers moving at different speeds', 'A hash set to track visited nodes', 'Recursive DFS', 'Sorting the list first'],
      correctIndex: 0,
    },
    {
      id: 'q-ll-h2', conceptId: 'c-linkedlists', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Reversing a singly linked list in-place has time complexity:',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctIndex: 2,
    },

    // Stacks
    {
      id: 'q-stk-d1', conceptId: 'c-stacks', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'A stack follows which principle?',
      options: ['FIFO (First In, First Out)', 'LIFO (Last In, First Out)', 'Random access', 'Priority-based access'], correctIndex: 1,
    },
    {
      id: 'q-stk-d2', conceptId: 'c-stacks', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Which of the following is a typical application of a stack?',
      options: ['BFS traversal', 'Undo/redo functionality', 'Round-robin scheduling', 'Priority queue'], correctIndex: 1,
    },
    {
      id: 'q-stk-e1', conceptId: 'c-stacks', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which operation adds an element to the top of a stack?',
      options: ['pop', 'push', 'enqueue', 'insert'], correctIndex: 1,
    },
    {
      id: 'q-stk-e2', conceptId: 'c-stacks', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What does "peek" (or "top") do on a stack?',
      options: ['Removes the top element', 'Returns the top element without removing it', 'Adds to the bottom', 'Reverses the stack'], correctIndex: 1,
    },
    {
      id: 'q-stk-m1', conceptId: 'c-stacks', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Checking balanced parentheses uses a stack because:',
      options: ['Stacks allow random access', 'The most recently opened bracket must be closed first (LIFO)', 'Stacks are sorted', 'Stacks have O(1) search'], correctIndex: 1,
    },
    {
      id: 'q-stk-m2', conceptId: 'c-stacks', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The call stack in programming handles function calls in which order?',
      options: ['FIFO', 'LIFO', 'Alphabetical', 'Random'], correctIndex: 1,
    },
    {
      id: 'q-stk-h1', conceptId: 'c-stacks', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Implementing a queue using two stacks results in amortized time complexity of:',
      options: ['O(n) per operation', 'O(1) amortized per operation', 'O(log n) per operation', 'O(n²) per operation'], correctIndex: 1,
    },
    {
      id: 'q-stk-h2', conceptId: 'c-stacks', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In a monotonic stack, elements are maintained in:',
      options: ['Random order', 'Sorted order (ascending or descending)', 'FIFO order', 'Hash order'], correctIndex: 1,
    },

    // Queues
    {
      id: 'q-que-d1', conceptId: 'c-queues', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'A queue follows which principle?',
      options: ['LIFO', 'FIFO', 'Random', 'Priority'], correctIndex: 1,
    },
    {
      id: 'q-que-d2', conceptId: 'c-queues', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Which data structure would you use for Breadth-First Search (BFS)?',
      options: ['Stack', 'Queue', 'Heap', 'Hash Map'], correctIndex: 1,
    },
    {
      id: 'q-que-e1', conceptId: 'c-queues', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which operation removes an element from a queue?',
      options: ['push', 'pop', 'dequeue', 'peek'], correctIndex: 2,
    },
    {
      id: 'q-que-e2', conceptId: 'c-queues', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Elements are added to a queue at the:',
      options: ['Front', 'Rear (back)', 'Middle', 'Random position'], correctIndex: 1,
    },
    {
      id: 'q-que-m1', conceptId: 'c-queues', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A circular queue overcomes which limitation of a simple array queue?',
      options: ['Slow access times', 'Memory waste when front pointer advances and rear space is unused', 'Inability to store duplicates', 'Lack of FIFO ordering'], correctIndex: 1,
    },
    {
      id: 'q-que-m2', conceptId: 'c-queues', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A priority queue serves elements based on:',
      options: ['Insertion order', 'Priority value', 'Alphabetical order', 'Random selection'], correctIndex: 1,
    },
    {
      id: 'q-que-h1', conceptId: 'c-queues', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In a deque (double-ended queue), you can:',
      options: ['Insert and delete only at the rear', 'Insert and delete only at the front', 'Insert and delete at both front and rear', 'Only read elements, not insert or delete'], correctIndex: 2,
    },
    {
      id: 'q-que-h2', conceptId: 'c-queues', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Sliding window maximum problem is solved efficiently using:',
      options: ['Simple queue', 'Stack', 'Deque (monotonic)', 'Circular buffer'], correctIndex: 2,
    },

    // Trees
    {
      id: 'q-tr-d1', conceptId: 'c-trees', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'In a tree, a node with no children is called a:',
      options: ['Root', 'Parent', 'Leaf', 'Branch'], correctIndex: 2,
    },
    {
      id: 'q-tr-d2', conceptId: 'c-trees', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'The height of a tree with a single root node (no children) is:',
      options: ['0', '1', '-1', 'Undefined'], correctIndex: 0,
    },
    {
      id: 'q-tr-e1', conceptId: 'c-trees', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The topmost node in a tree is called the:',
      options: ['Leaf', 'Child', 'Root', 'Parent'], correctIndex: 2,
    },
    {
      id: 'q-tr-e2', conceptId: 'c-trees', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'An edge in a tree connects:',
      options: ['Two roots', 'A parent and a child', 'Two leaves', 'Two siblings'], correctIndex: 1,
    },
    {
      id: 'q-tr-m1', conceptId: 'c-trees', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A tree with n nodes has exactly how many edges?',
      options: ['n', 'n-1', 'n+1', '2n'], correctIndex: 1,
    },
    {
      id: 'q-tr-m2', conceptId: 'c-trees', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The depth of the root node in any tree is:',
      options: ['1', '-1', '0', 'Depends on tree size'], correctIndex: 2,
    },
    {
      id: 'q-tr-h1', conceptId: 'c-trees', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'An AVL tree maintains balance by ensuring:',
      options: ['All leaves are at the same level', 'The height difference between left and right subtrees is at most 1', 'Each node has exactly 2 children', 'Nodes are stored in sorted order'], correctIndex: 1,
    },
    {
      id: 'q-tr-h2', conceptId: 'c-trees', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In a B-Tree of order m, each internal node has at most:',
      options: ['m children', 'm-1 children', 'm+1 children', '2m children'], correctIndex: 0,
    },

    // Binary Trees
    {
      id: 'q-bt-d1', conceptId: 'c-binarytrees', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'In a binary tree, each node has at most how many children?',
      options: ['1', '2', '3', 'Unlimited'], correctIndex: 1,
    },
    {
      id: 'q-bt-d2', conceptId: 'c-binarytrees', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'In a Binary Search Tree (BST), for any node, its left subtree contains values that are:',
      options: ['Greater than the node', 'Less than the node', 'Equal to the node', 'Random'], correctIndex: 1,
    },
    {
      id: 'q-bt-e1', conceptId: 'c-binarytrees', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A full binary tree is one where every node has:',
      options: ['Exactly 2 children', '0 or 2 children (never 1)', 'At most 2 children', 'At least 1 child'], correctIndex: 1,
    },
    {
      id: 'q-bt-e2', conceptId: 'c-binarytrees', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A complete binary tree has all levels filled except possibly the last, which is:',
      options: ['Empty', 'Filled from right to left', 'Filled from left to right', 'Random'], correctIndex: 2,
    },
    {
      id: 'q-bt-m1', conceptId: 'c-binarytrees', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The maximum number of nodes in a binary tree of height h is:',
      options: ['h', '2h', '2^(h+1) - 1', 'h²'], correctIndex: 2,
    },
    {
      id: 'q-bt-m2', conceptId: 'c-binarytrees', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Searching in a balanced BST has time complexity:',
      options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctIndex: 2,
    },
    {
      id: 'q-bt-h1', conceptId: 'c-binarytrees', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A Red-Black Tree guarantees that operations (insert, delete, search) run in:',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctIndex: 1,
    },
    {
      id: 'q-bt-h2', conceptId: 'c-binarytrees', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Serializing a binary tree to reconstruct it uniquely requires:',
      options: ['Inorder traversal only', 'Preorder traversal only', 'Either preorder or postorder + inorder, or level-order with nulls', 'Postorder only'], correctIndex: 2,
    },

    // Tree Traversal
    {
      id: 'q-tv-d1', conceptId: 'c-traversal', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'In-order traversal of a BST visits nodes in which order?',
      options: ['Root, Left, Right', 'Left, Root, Right', 'Left, Right, Root', 'Right, Root, Left'], correctIndex: 1,
    },
    {
      id: 'q-tv-d2', conceptId: 'c-traversal', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Which traversal visits the root node LAST?',
      options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correctIndex: 2,
    },
    {
      id: 'q-tv-e1', conceptId: 'c-traversal', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Pre-order traversal visits nodes in the order:',
      options: ['Left, Root, Right', 'Root, Left, Right', 'Left, Right, Root', 'Right, Left, Root'], correctIndex: 1,
    },
    {
      id: 'q-tv-e2', conceptId: 'c-traversal', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Level-order (BFS) traversal uses which data structure?',
      options: ['Stack', 'Heap', 'Queue', 'Linked List'], correctIndex: 2,
    },
    {
      id: 'q-tv-m1', conceptId: 'c-traversal', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Post-order traversal is typically used for:',
      options: ['Printing a sorted BST', 'Deleting a tree (process children before parent)', 'Level-by-level printing', 'Finding the root'], correctIndex: 1,
    },
    {
      id: 'q-tv-m2', conceptId: 'c-traversal', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Given a BST, which traversal produces values in ascending sorted order?',
      options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'], correctIndex: 2,
    },
    {
      id: 'q-tv-h1', conceptId: 'c-traversal', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Morris traversal achieves in-order traversal with:',
      options: ['O(n) space using a stack', 'O(n) space using a queue', 'O(1) extra space by threading the tree', 'O(log n) space'], correctIndex: 2,
    },
    {
      id: 'q-tv-h2', conceptId: 'c-traversal', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'To reconstruct a unique binary tree, you need:',
      options: ['Inorder only', 'Preorder only', 'Inorder + Preorder, or Inorder + Postorder', 'Level-order only'], correctIndex: 2,
    },

    // ------------------------------------------------------------
    // MATHEMATICS QUESTIONS (6 concepts × 8 questions = 48)
    // ------------------------------------------------------------
    // 1. Linear Equations
    {
      id: 'q-m-leq-d1', conceptId: 'c-math-linear-eq', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the solution for x in the equation 3x + 9 = 0?',
      options: ['3', '-3', '9', '-9'], correctIndex: 1,
    },
    {
      id: 'q-m-leq-d2', conceptId: 'c-math-linear-eq', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the slope (m) of the line represented by 2y - 6x = 8?',
      options: ['2', '3', '-3', '6'], correctIndex: 1,
    },
    {
      id: 'q-m-leq-e1', conceptId: 'c-math-linear-eq', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In the slope-intercept form y = mx + b, what does b represent?',
      options: ['The x-intercept', 'The y-intercept', 'The slope', 'The curvature'], correctIndex: 1,
    },
    {
      id: 'q-m-leq-e2', conceptId: 'c-math-linear-eq', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Solve for x: 5x - 15 = 0',
      options: ['0', '3', '-3', '5'], correctIndex: 1,
    },
    {
      id: 'q-m-leq-m1', conceptId: 'c-math-linear-eq', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Two parallel lines have slopes m₁ and m₂. Which relationship is always true?',
      options: ['m₁ = -m₂', 'm₁ · m₂ = -1', 'm₁ = m₂', 'm₁ + m₂ = 0'], correctIndex: 2,
    },
    {
      id: 'q-m-leq-m2', conceptId: 'c-math-linear-eq', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Solve the system of equations: x + y = 10, x - y = 4. What is x?',
      options: ['5', '6', '7', '8'], correctIndex: 2,
    },
    {
      id: 'q-m-leq-h1', conceptId: 'c-math-linear-eq', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What condition makes the matrix equation Ax = b have infinitely many solutions?',
      options: ['det(A) ≠ 0', 'A is invertible', 'det(A) = 0 and b is in the column space of A', 'b is orthogonal to all columns of A'], correctIndex: 2,
    },
    {
      id: 'q-m-leq-h2', conceptId: 'c-math-linear-eq', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'For what value of k will the lines 2x + ky = 5 and 4x + 6y = 10 be identical (coincident)?',
      options: ['2', '3', '6', '4'], correctIndex: 1,
    },

    // 2. Quadratic Equations
    {
      id: 'q-m-qeq-d1', conceptId: 'c-math-quadratic-eq', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the discriminant formula for a quadratic equation ax² + bx + c = 0?',
      options: ['b² - 4ac', 'b² + 4ac', '2a - 4bc', '√(b² - 4ac)'], correctIndex: 0,
    },
    {
      id: 'q-m-qeq-d2', conceptId: 'c-math-quadratic-eq', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'If the discriminant b² - 4ac < 0, what can be said about the roots of ax² + bx + c = 0?',
      options: ['Two equal real roots', 'Two distinct real roots', 'Two complex conjugate roots', 'No roots exist'], correctIndex: 2,
    },
    {
      id: 'q-m-qeq-e1', conceptId: 'c-math-quadratic-eq', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What are the roots of x² - 9 = 0?',
      options: ['3 only', '-3 only', '3 and -3', '9 and -9'], correctIndex: 2,
    },
    {
      id: 'q-m-qeq-e2', conceptId: 'c-math-quadratic-eq', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The vertex x-coordinate of the parabola y = ax² + bx + c is given by:',
      options: ['-b / (2a)', 'b / (2a)', '-b / a', 'c / a'], correctIndex: 0,
    },
    {
      id: 'q-m-qeq-m1', conceptId: 'c-math-quadratic-eq', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What are the roots of x² - 5x + 6 = 0?',
      options: ['2 and 3', '-2 and -3', '1 and 6', '-1 and -6'], correctIndex: 0,
    },
    {
      id: 'q-m-qeq-m2', conceptId: 'c-math-quadratic-eq', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'By Vieta\'s formulas, the product of the roots of 2x² - 8x + 6 = 0 is:',
      options: ['4', '3', '6', '-3'], correctIndex: 1,
    },
    {
      id: 'q-m-qeq-h1', conceptId: 'c-math-quadratic-eq', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'For what values of m does the equation x² - 2mx + (m² - 1) = 0 have roots differing by exactly 2?',
      options: ['All real values of m', 'm = 0 only', 'm = 1 only', 'No real values of m'], correctIndex: 0,
    },
    {
      id: 'q-m-qeq-h2', conceptId: 'c-math-quadratic-eq', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'If α and β are roots of x² + px + q = 0, what is the value of α² + β²?',
      options: ['p² - 2q', 'p² + 2q', 'q² - 2p', 'p² - 4q'], correctIndex: 0,
    },

    // 3. Functions & Graphs
    {
      id: 'q-m-fn-d1', conceptId: 'c-math-functions', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Which test is used on a graph to determine if it represents a function y = f(x)?',
      options: ['Horizontal line test', 'Vertical line test', 'Diagonal line test', 'Circle test'], correctIndex: 1,
    },
    {
      id: 'q-m-fn-d2', conceptId: 'c-math-functions', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the domain of f(x) = 1 / √(x - 4)?',
      options: ['[4, ∞)', '(4, ∞)', '(-∞, 4)', '(-∞, ∞)'], correctIndex: 1,
    },
    {
      id: 'q-m-fn-e1', conceptId: 'c-math-functions', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'If f(x) = 2x + 3, what is f(4)?',
      options: ['8', '11', '14', '7'], correctIndex: 1,
    },
    {
      id: 'q-m-fn-e2', conceptId: 'c-math-functions', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A function f(x) is called an even function if:',
      options: ['f(-x) = -f(x)', 'f(-x) = f(x)', 'f(x) = -f(x)', 'f(1/x) = f(x)'], correctIndex: 1,
    },
    {
      id: 'q-m-fn-m1', conceptId: 'c-math-functions', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Given f(x) = 3x - 5, what is the inverse function f⁻¹(x)?',
      options: ['(x + 5) / 3', '(x - 5) / 3', '3x + 5', '1 / (3x - 5)'], correctIndex: 0,
    },
    {
      id: 'q-m-fn-m2', conceptId: 'c-math-functions', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'If f(x) = x² and g(x) = x + 1, what is (f ∘ g)(2)?',
      options: ['5', '9', '6', '8'], correctIndex: 1,
    },
    {
      id: 'q-m-fn-h1', conceptId: 'c-math-functions', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A function f: A → B is bijective if and only if it is:',
      options: ['Injective (one-to-one) only', 'Surjective (onto) only', 'Both injective and surjective', 'Continuous and differentiable'], correctIndex: 2,
    },
    {
      id: 'q-m-fn-h2', conceptId: 'c-math-functions', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What transformation maps the graph of y = f(x) to y = 2f(x - 3) + 1?',
      options: [
        'Horizontal shift left 3, vertical stretch by 2, vertical shift down 1',
        'Horizontal shift right 3, vertical stretch by 2, vertical shift up 1',
        'Horizontal stretch by 2, horizontal shift right 3, vertical shift up 1',
        'Vertical shift up 3, horizontal stretch by 2, vertical shift up 1'
      ],
      correctIndex: 1,
    },

    // 4. Limits & Continuity
    {
      id: 'q-m-lim-d1', conceptId: 'c-math-limits', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is lim (x → 2) of (3x + 4)?',
      options: ['6', '8', '10', '12'], correctIndex: 2,
    },
    {
      id: 'q-m-lim-d2', conceptId: 'c-math-limits', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is lim (x → 0) of (sin x / x) when x is in radians?',
      options: ['0', '1', 'Undefined', '∞'], correctIndex: 1,
    },
    {
      id: 'q-m-lim-e1', conceptId: 'c-math-limits', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'For a function to be continuous at x = c, which condition must hold?',
      options: ['f(c) exists and lim(x→c) f(x) exists and lim(x→c) f(x) = f(c)', 'f(c) > 0', 'f\'(c) exists', 'The function is increasing at c'], correctIndex: 0,
    },
    {
      id: 'q-m-lim-e2', conceptId: 'c-math-limits', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is lim (x → ∞) of (1 / x)?',
      options: ['1', '0', '∞', '-∞'], correctIndex: 1,
    },
    {
      id: 'q-m-lim-m1', conceptId: 'c-math-limits', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Evaluate lim (x → 3) of (x² - 9) / (x - 3):',
      options: ['0', '3', '6', 'Undefined'], correctIndex: 2,
    },
    {
      id: 'q-m-lim-m2', conceptId: 'c-math-limits', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'L\'Hôpital\'s Rule can be applied when an indeterminate form is of type:',
      options: ['0/0 or ∞/∞', '0 · 1', '1^0', '∞ - 0'], correctIndex: 0,
    },
    {
      id: 'q-m-lim-h1', conceptId: 'c-math-limits', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is lim (x → 0) of (1 - cos x) / x²?',
      options: ['0', '1/2', '1', '2'], correctIndex: 1,
    },
    {
      id: 'q-m-lim-h2', conceptId: 'c-math-limits', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Evaluate lim (x → ∞) of (1 + 1/x)^x:',
      options: ['1', '0', 'e', '∞'], correctIndex: 2,
    },

    // 5. Derivatives & Differentiation
    {
      id: 'q-m-der-d1', conceptId: 'c-math-derivatives', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Using the power rule, what is the derivative d/dx (x⁴)?',
      options: ['4x³', '3x⁴', '4x⁵', 'x³'], correctIndex: 0,
    },
    {
      id: 'q-m-der-d2', conceptId: 'c-math-derivatives', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the product rule for differentiating f(x) · g(x)?',
      options: ['f\'(x)g\'(x)', 'f\'(x)g(x) + f(x)g\'(x)', 'f\'(x)g(x) - f(x)g\'(x)', '(f\'(x)g(x)) / g(x)²'], correctIndex: 1,
    },
    {
      id: 'q-m-der-e1', conceptId: 'c-math-derivatives', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the derivative of sin(x) with respect to x?',
      options: ['-cos(x)', 'cos(x)', '-sin(x)', 'tan(x)'], correctIndex: 1,
    },
    {
      id: 'q-m-der-e2', conceptId: 'c-math-derivatives', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the derivative of e^x with respect to x?',
      options: ['x · e^(x-1)', 'e^x', 'ln(x)', '1 / e^x'], correctIndex: 1,
    },
    {
      id: 'q-m-der-m1', conceptId: 'c-math-derivatives', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Using the chain rule, what is d/dx [sin(x²)]?',
      options: ['2x cos(x²)', 'cos(x²)', '2x sin(x)', '-2x cos(x²)'], correctIndex: 0,
    },
    {
      id: 'q-m-der-m2', conceptId: 'c-math-derivatives', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'If f\'(c) = 0 and f\'\'(c) < 0, then x = c is a:',
      options: ['Local minimum', 'Local maximum', 'Inflection point', 'Discontinuity'], correctIndex: 1,
    },
    {
      id: 'q-m-der-h1', conceptId: 'c-math-derivatives', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Find dy/dx for x² + y² = 25 using implicit differentiation:',
      options: ['-x / y', 'x / y', '-y / x', '2x + 2y'], correctIndex: 0,
    },
    {
      id: 'q-m-der-h2', conceptId: 'c-math-derivatives', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the 50th derivative of sin(x)?',
      options: ['sin(x)', '-sin(x)', 'cos(x)', '-cos(x)'], correctIndex: 1,
    },

    // 6. Integrals
    {
      id: 'q-m-int-d1', conceptId: 'c-math-integrals', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the indefinite integral ∫ 3x² dx?',
      options: ['x³ + C', '6x + C', 'x⁴ + C', '3x³ + C'], correctIndex: 0,
    },
    {
      id: 'q-m-int-d2', conceptId: 'c-math-integrals', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'According to the Fundamental Theorem of Calculus, if F\'(x) = f(x), then ∫ [a to b] f(x) dx is:',
      options: ['F(a) - F(b)', 'F(b) - F(a)', 'F\'(b) - F\'(a)', 'f(b) - f(a)'], correctIndex: 1,
    },
    {
      id: 'q-m-int-e1', conceptId: 'c-math-integrals', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is ∫ e^x dx?',
      options: ['e^x + C', 'xe^x + C', 'e^(x+1) + C', 'ln(x) + C'], correctIndex: 0,
    },
    {
      id: 'q-m-int-e2', conceptId: 'c-math-integrals', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Evaluate ∫ [0 to 2] 2x dx:',
      options: ['2', '4', '8', '0'], correctIndex: 1,
    },
    {
      id: 'q-m-int-m1', conceptId: 'c-math-integrals', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What integration technique uses the formula ∫ u dv = uv - ∫ v du?',
      options: ['Substitution', 'Integration by parts', 'Partial fractions', 'Trigonometric substitution'], correctIndex: 1,
    },
    {
      id: 'q-m-int-m2', conceptId: 'c-math-integrals', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is ∫ (1 / x) dx for x > 0?',
      options: ['-1/x² + C', 'ln(x) + C', 'x + C', 'e^x + C'], correctIndex: 1,
    },
    {
      id: 'q-m-int-h1', conceptId: 'c-math-integrals', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Evaluate ∫ x · e^x dx using integration by parts:',
      options: ['e^x(x - 1) + C', 'e^x(x + 1) + C', 'x²e^x + C', 'e^x / x + C'], correctIndex: 0,
    },
    {
      id: 'q-m-int-h2', conceptId: 'c-math-integrals', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the area under the curve y = sin(x) from x = 0 to x = π?',
      options: ['0', '1', '2', 'π'], correctIndex: 2,
    },

    // ------------------------------------------------------------
    // PHYSICS QUESTIONS (6 concepts × 8 questions = 48)
    // ------------------------------------------------------------
    // 1. Kinematics
    {
      id: 'q-p-kin-d1', conceptId: 'c-phys-kinematics', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the SI unit of acceleration?',
      options: ['m/s', 'm/s²', 'N', 'kg·m/s'], correctIndex: 1,
    },
    {
      id: 'q-p-kin-d2', conceptId: 'c-phys-kinematics', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'An object dropped from rest under gravity (g = 9.8 m/s²) falls for 2 seconds. What distance does it fall?',
      options: ['9.8 m', '19.6 m', '39.2 m', '4.9 m'], correctIndex: 1,
    },
    {
      id: 'q-p-kin-e1', conceptId: 'c-phys-kinematics', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Speed is a scalar quantity while velocity is a:',
      options: ['Scalar', 'Vector', 'Tensor', 'Constant'], correctIndex: 1,
    },
    {
      id: 'q-p-kin-e2', conceptId: 'c-phys-kinematics', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The slope of a position-versus-time graph represents:',
      options: ['Acceleration', 'Velocity', 'Displacement', 'Force'], correctIndex: 1,
    },
    {
      id: 'q-p-kin-m1', conceptId: 'c-phys-kinematics', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which kinematic equation does NOT include acceleration (a)?',
      options: ['v = u + at', 's = ut + ½at²', 's = ((u + v) / 2) · t', 'v² = u² + 2as'], correctIndex: 2,
    },
    {
      id: 'q-p-kin-m2', conceptId: 'c-phys-kinematics', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In projectile motion (ignoring air resistance), what is the horizontal acceleration?',
      options: ['9.8 m/s²', '0 m/s²', '-9.8 m/s²', 'Depends on launch angle'], correctIndex: 1,
    },
    {
      id: 'q-p-kin-h1', conceptId: 'c-phys-kinematics', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'At what launch angle above the horizontal is the range of a projectile maximized on flat ground?',
      options: ['30°', '45°', '60°', '90°'], correctIndex: 1,
    },
    {
      id: 'q-p-kin-h2', conceptId: 'c-phys-kinematics', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A car decelerates uniformly from 30 m/s to 10 m/s over 100 meters. What is the deceleration rate?',
      options: ['2 m/s²', '4 m/s²', '8 m/s²', '1 m/s²'], correctIndex: 1,
    },

    // 2. Newton's Laws
    {
      id: 'q-p-newt-d1', conceptId: 'c-phys-newtons-laws', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'According to Newton\'s First Law, an object at rest will remain at rest unless acted upon by:',
      options: ['A balanced force', 'An unbalanced external net force', 'Gravity', 'Friction'], correctIndex: 1,
    },
    {
      id: 'q-p-newt-d2', conceptId: 'c-phys-newtons-laws', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'A net force of 20 N is applied to an object of mass 5 kg. What is its acceleration?',
      options: ['100 m/s²', '4 m/s²', '0.25 m/s²', '15 m/s²'], correctIndex: 1,
    },
    {
      id: 'q-p-newt-e1', conceptId: 'c-phys-newtons-laws', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the formula for Newton\'s Second Law?',
      options: ['F = m / a', 'F = m · a', 'F = ½ m v²', 'F = m · g · h'], correctIndex: 1,
    },
    {
      id: 'q-p-newt-e2', conceptId: 'c-phys-newtons-laws', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Newton\'s Third Law states that for every action, there is:',
      options: ['A greater reaction', 'An equal and opposite reaction', 'No reaction', 'A proportional reaction in the same direction'], correctIndex: 1,
    },
    {
      id: 'q-p-newt-m1', conceptId: 'c-phys-newtons-laws', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'An elevator of mass 1000 kg accelerates upward at 2 m/s² (g = 9.8 m/s²). What is the cable tension?',
      options: ['9800 N', '11800 N', '7800 N', '2000 N'], correctIndex: 1,
    },
    {
      id: 'q-p-newt-m2', conceptId: 'c-phys-newtons-laws', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The maximum static friction force is given by f_s(max) =',
      options: ['μ_s · N', 'μ_k · N', 'm · g', 'μ_s / N'], correctIndex: 0,
    },
    {
      id: 'q-p-newt-h1', conceptId: 'c-phys-newtons-laws', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A block slides down a frictionless incline of angle θ. Its acceleration along the incline is:',
      options: ['g cos θ', 'g sin θ', 'g tan θ', 'g'], correctIndex: 1,
    },
    {
      id: 'q-p-newt-h2', conceptId: 'c-phys-newtons-laws', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In Atwood\'s machine with masses m₁ and m₂ (m₁ > m₂), the acceleration of the system is:',
      options: ['g · (m₁ - m₂) / (m₁ + m₂)', 'g · (m₁ + m₂) / (m₁ - m₂)', 'g · m₁ / m₂', 'g · (m₁ · m₂) / (m₁ + m₂)'], correctIndex: 0,
    },

    // 3. Work, Energy & Power
    {
      id: 'q-p-wep-d1', conceptId: 'c-phys-work-energy', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the formula for kinetic energy of an object of mass m and velocity v?',
      options: ['m · v', '½ m v²', 'm · g · h', 'F · d'], correctIndex: 1,
    },
    {
      id: 'q-p-wep-d2', conceptId: 'c-phys-work-energy', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'If the speed of a moving car is doubled, by what factor does its kinetic energy increase?',
      options: ['2', '4', '8', 'Remains the same'], correctIndex: 1,
    },
    {
      id: 'q-p-wep-e1', conceptId: 'c-phys-work-energy', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Work is defined as W = F · d · cos(θ). What is the work done if force is perpendicular to displacement (θ = 90°)?',
      options: ['F · d', '0 J', '-F · d', '½ F · d'], correctIndex: 1,
    },
    {
      id: 'q-p-wep-e2', conceptId: 'c-phys-work-energy', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the SI unit of power?',
      options: ['Joule', 'Watt', 'Newton', 'Pascal'], correctIndex: 1,
    },
    {
      id: 'q-p-wep-m1', conceptId: 'c-phys-work-energy', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The work-energy theorem states that the net work done on an object equals:',
      options: ['Change in potential energy', 'Change in kinetic energy', 'Total mechanical energy', 'Change in momentum'], correctIndex: 1,
    },
    {
      id: 'q-p-wep-m2', conceptId: 'c-phys-work-energy', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A 2 kg book is lifted vertically by 3 meters (g = 9.8 m/s²). The gravitational potential energy gained is:',
      options: ['58.8 J', '29.4 J', '19.6 J', '6 J'], correctIndex: 0,
    },
    {
      id: 'q-p-wep-h1', conceptId: 'c-phys-work-energy', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A spring with spring constant k is compressed by distance x. The elastic potential energy stored is:',
      options: ['k · x', '½ k x²', 'k x²', '½ k / x'], correctIndex: 1,
    },
    {
      id: 'q-p-wep-h2', conceptId: 'c-phys-work-energy', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A motor operates at 500 W for 10 seconds with an efficiency of 80%. How much useful work does it output?',
      options: ['5000 J', '4000 J', '6250 J', '800 J'], correctIndex: 1,
    },

    // 4. Momentum & Collisions
    {
      id: 'q-p-mom-d1', conceptId: 'c-phys-momentum', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Linear momentum p of an object is calculated as:',
      options: ['m / v', 'm · v', '½ m v²', 'F · t'], correctIndex: 1,
    },
    {
      id: 'q-p-mom-d2', conceptId: 'c-phys-momentum', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'In an elastic collision between two isolated objects, which quantities are conserved?',
      options: ['Momentum only', 'Kinetic energy only', 'Both momentum and kinetic energy', 'Neither momentum nor kinetic energy'], correctIndex: 2,
    },
    {
      id: 'q-p-mom-e1', conceptId: 'c-phys-momentum', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Impulse is equal to the change in:',
      options: ['Kinetic energy', 'Potential energy', 'Momentum', 'Force'], correctIndex: 2,
    },
    {
      id: 'q-p-mom-e2', conceptId: 'c-phys-momentum', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the SI unit of momentum?',
      options: ['kg·m/s', 'N/s', 'J·s', 'kg·m²/s²'], correctIndex: 0,
    },
    {
      id: 'q-p-mom-m1', conceptId: 'c-phys-momentum', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In a perfectly inelastic collision, the colliding objects:',
      options: ['Bounce apart with no energy loss', 'Stick together after colliding', 'Stop immediately', 'Explode'], correctIndex: 1,
    },
    {
      id: 'q-p-mom-m2', conceptId: 'c-phys-momentum', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A 2 kg mass moving at 4 m/s hits a stationary 2 kg mass in an elastic collision. What is the velocity of the first mass after collision?',
      options: ['4 m/s', '2 m/s', '0 m/s', '-2 m/s'], correctIndex: 2,
    },
    {
      id: 'q-p-mom-h1', conceptId: 'c-phys-momentum', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A rocket burns fuel at rate dm/dt with exhaust velocity v_e. The thrust force is given by Tchebyshev/Tsiolkovsky relation:',
      options: ['v_e · (dm/dt)', '½ (dm/dt) v_e²', '(dm/dt) / v_e', 'm · v_e'], correctIndex: 0,
    },
    {
      id: 'q-p-mom-h2', conceptId: 'c-phys-momentum', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The coefficient of restitution (e) for a perfectly elastic collision is:',
      options: ['0', '1', '0.5', '∞'], correctIndex: 1,
    },

    // 5. Thermodynamics
    {
      id: 'q-p-thm-d1', conceptId: 'c-phys-thermo', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'The First Law of Thermodynamics is a statement of conservation of:',
      options: ['Mass', 'Momentum', 'Energy', 'Entropy'], correctIndex: 2,
    },
    {
      id: 'q-p-thm-d2', conceptId: 'c-phys-thermo', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'In an isothermal process for an ideal gas, which variable remains constant?',
      options: ['Pressure', 'Volume', 'Temperature', 'Entropy'], correctIndex: 2,
    },
    {
      id: 'q-p-thm-e1', conceptId: 'c-phys-thermo', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is absolute zero in degrees Celsius?',
      options: ['0 °C', '-100 °C', '-273.15 °C', '-459.67 °C'], correctIndex: 2,
    },
    {
      id: 'q-p-thm-e2', conceptId: 'c-phys-thermo', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The Zeroth Law of Thermodynamics establishes the concept of:',
      options: ['Work', 'Temperature', 'Entropy', 'Pressure'], correctIndex: 1,
    },
    {
      id: 'q-p-thm-m1', conceptId: 'c-phys-thermo', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In an adiabatic process, the heat transferred (Q) is:',
      options: ['Q > 0', 'Q < 0', 'Q = 0', 'Q = W'], correctIndex: 2,
    },
    {
      id: 'q-p-thm-m2', conceptId: 'c-phys-thermo', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The maximum theoretical efficiency of a heat engine operating between T_cold and T_hot is given by Carnot formula:',
      options: ['1 - (T_cold / T_hot)', '1 - (T_hot / T_cold)', 'T_hot / T_cold', '(T_hot + T_cold) / T_hot'], correctIndex: 0,
    },
    {
      id: 'q-p-thm-h1', conceptId: 'c-phys-thermo', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The Second Law of Thermodynamics states that the total entropy of an isolated system:',
      options: ['Always decreases', 'Never decreases over time', 'Remains exactly constant', 'Oscillates sinusoidally'], correctIndex: 1,
    },
    {
      id: 'q-p-thm-h2', conceptId: 'c-phys-thermo', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'For a monoatomic ideal gas, what is the ratio of specific heats γ = C_p / C_v?',
      options: ['5/3 (≈ 1.67)', '7/5 (≈ 1.40)', '4/3 (≈ 1.33)', '1.00'], correctIndex: 0,
    },

    // 6. Waves & Sound
    {
      id: 'q-p-wav-d1', conceptId: 'c-phys-waves-sound', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the relationship between wave speed (v), frequency (f), and wavelength (λ)?',
      options: ['v = f / λ', 'v = f · λ', 'v = λ / f', 'v = f + λ'], correctIndex: 1,
    },
    {
      id: 'q-p-wav-d2', conceptId: 'c-phys-waves-sound', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'The Doppler effect describes the observed change in frequency of a wave when:',
      options: [
        'The medium changes density',
        'There is relative motion between source and observer',
        'The wave reflects off a hard surface',
        'The wave passes through a narrow slit'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-p-wav-e1', conceptId: 'c-phys-waves-sound', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Sound waves in air are classified as:',
      options: ['Transverse waves', 'Longitudinal waves', 'Electromagnetic waves', 'Torsional waves'], correctIndex: 1,
    },
    {
      id: 'q-p-wav-e2', conceptId: 'c-phys-waves-sound', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The human hearing range is approximately:',
      options: ['2 Hz to 200 Hz', '20 Hz to 20,000 Hz', '200 Hz to 200,000 Hz', '0 Hz to 100 Hz'], correctIndex: 1,
    },
    {
      id: 'q-p-wav-m1', conceptId: 'c-phys-waves-sound', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'When two waves with identical frequency and amplitude arrive in phase, the result is:',
      options: ['Destructive interference (zero amplitude)', 'Constructive interference (double amplitude)', 'Diffraction', 'Polarization'], correctIndex: 1,
    },
    {
      id: 'q-p-wav-m2', conceptId: 'c-phys-waves-sound', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Standing waves on a string fixed at both ends have nodes at:',
      options: ['Both ends', 'The center only', 'No positions', 'Random intervals'], correctIndex: 0,
    },
    {
      id: 'q-p-wav-h1', conceptId: 'c-phys-waves-sound', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The speed of sound in an ideal gas depends primarily on:',
      options: ['Absolute temperature (T)', 'Pressure (P) only', 'Volume (V) only', 'Wave amplitude'], correctIndex: 0,
    },
    {
      id: 'q-p-wav-h2', conceptId: 'c-phys-waves-sound', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Sound intensity level β in decibels (dB) for intensity I relative to threshold I₀ is defined as:',
      options: ['10 · log₁₀(I / I₀)', 'log₁₀(I / I₀)', '20 · ln(I / I₀)', 'I / I₀'], correctIndex: 0,
    },

    // ------------------------------------------------------------
    // CHEMISTRY QUESTIONS (6 concepts × 8 questions = 48)
    // ------------------------------------------------------------
    // 1. Atomic Structure & Isotopes
    {
      id: 'q-c-atm-d1', conceptId: 'c-chem-atomic-struct', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Which subatomic particles are located in the nucleus of an atom?',
      options: ['Electrons and protons', 'Protons and neutrons', 'Electrons and neutrons', 'Electrons only'], correctIndex: 1,
    },
    {
      id: 'q-c-atm-d2', conceptId: 'c-chem-atomic-struct', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Isotopes of the same element have the same number of protons but different numbers of:',
      options: ['Electrons', 'Neutrons', 'Photons', 'Valence shells'], correctIndex: 1,
    },
    {
      id: 'q-c-atm-e1', conceptId: 'c-chem-atomic-struct', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the atomic number (Z) of an atom equal to?',
      options: ['Number of neutrons', 'Number of protons', 'Number of protons + neutrons', 'Total mass'], correctIndex: 1,
    },
    {
      id: 'q-c-atm-e2', conceptId: 'c-chem-atomic-struct', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What electrical charge does an electron carry?',
      options: ['+1', '-1', '0', '+2'], correctIndex: 1,
    },
    {
      id: 'q-c-atm-m1', conceptId: 'c-chem-atomic-struct', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the electron configuration of a neutral Carbon atom (Z = 6)?',
      options: ['1s² 2s² 2p²', '1s² 2s⁴', '1s² 2p⁴', '1s⁶'], correctIndex: 0,
    },
    {
      id: 'q-c-atm-m2', conceptId: 'c-chem-atomic-struct', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'According to Hund\'s Rule, electrons occupy degenerate orbitals by:',
      options: [
        'Pairing up immediately',
        'Singly occupying each orbital before pairing',
        'Filling high-energy orbitals first',
        'Emitting photons'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-c-atm-h1', conceptId: 'c-chem-atomic-struct', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What are the four quantum numbers (n, l, m_l, m_s) describing?',
      options: [
        'Mass, charge, volume, and density of an atom',
        'Energy level, orbital shape, orbital orientation, and electron spin',
        'Proton, neutron, electron, and photon counts',
        'Bond angle, bond length, polarity, and dipole moment'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-c-atm-h2', conceptId: 'c-chem-atomic-struct', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Carbon-14 (half-life = 5730 years) decays into Nitrogen-14 primarily via:',
      options: ['Alpha decay', 'Beta-minus decay', 'Positron emission', 'Gamma emission'], correctIndex: 1,
    },

    // 2. Periodic Trends
    {
      id: 'q-c-per-d1', conceptId: 'c-chem-periodic-table', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'As you move from left to right across a period in the periodic table, electronegativity generally:',
      options: ['Increases', 'Decreases', 'Remains constant', 'First decreases then increases'], correctIndex: 0,
    },
    {
      id: 'q-c-per-d2', conceptId: 'c-chem-periodic-table', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'Which group of elements has completely filled valence electron shells and is chemically inert?',
      options: ['Alkali metals', 'Halogens', 'Noble gases', 'Transition metals'], correctIndex: 2,
    },
    {
      id: 'q-c-per-e1', conceptId: 'c-chem-periodic-table', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which element is the most electronegative in the periodic table?',
      options: ['Oxygen (O)', 'Chlorine (Cl)', 'Fluorine (F)', 'Nitrogen (N)'], correctIndex: 2,
    },
    {
      id: 'q-c-per-e2', conceptId: 'c-chem-periodic-table', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Elements in the same column (group) of the periodic table share the same number of:',
      options: ['Total electrons', 'Valence electrons', 'Neutrons', 'Protons'], correctIndex: 1,
    },
    {
      id: 'q-c-per-m1', conceptId: 'c-chem-periodic-table', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'As you go DOWN a group in the periodic table, atomic radius generally:',
      options: ['Decreases', 'Increases', 'Stays the same', 'Becomes zero'], correctIndex: 1,
    },
    {
      id: 'q-c-per-m2', conceptId: 'c-chem-periodic-table', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Ionization energy is defined as the energy required to:',
      options: [
        'Add an electron to a neutral atom',
        'Remove an electron from an isolated gaseous atom',
        'Break a chemical bond',
        'Melt a solid metal'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-c-per-h1', conceptId: 'c-chem-periodic-table', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Why is the first ionization energy of Nitrogen (N, Z=7) higher than that of Oxygen (O, Z=8)?',
      options: [
        'Nitrogen has a smaller atomic radius',
        'Nitrogen has a half-filled 2p³ subshell which gives extra stability',
        'Oxygen has fewer protons',
        'Nitrogen is a noble gas'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-c-per-h2', conceptId: 'c-chem-periodic-table', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which is larger in radius: a neutral Chlorine atom (Cl) or a Chloride ion (Cl⁻)?',
      options: [
        'Cl⁻ is larger due to increased electron-electron repulsion',
        'Cl is larger due to more protons',
        'They have identical radii',
        'Cl is larger due to less shielding'
      ],
      correctIndex: 0,
    },

    // 3. Chemical Bonding
    {
      id: 'q-c-bnd-d1', conceptId: 'c-chem-bonding', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'An ionic bond is typically formed between:',
      options: ['Two nonmetals', 'A metal and a nonmetal', 'Two metals', 'Two noble gases'], correctIndex: 1,
    },
    {
      id: 'q-c-bnd-d2', conceptId: 'c-chem-bonding', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the molecular geometry of a methane (CH₄) molecule according to VSEPR theory?',
      options: ['Linear', 'Trigonal planar', 'Tetrahedral', 'Octahedral'], correctIndex: 2,
    },
    {
      id: 'q-c-bnd-e1', conceptId: 'c-chem-bonding', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A covalent bond is formed by:',
      options: ['Transfer of electrons', 'Sharing of electron pairs', 'Magnetic attraction', 'Proton sharing'], correctIndex: 1,
    },
    {
      id: 'q-c-bnd-e2', conceptId: 'c-chem-bonding', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'How many covalent bonds are present in a molecule of water (H₂O)?',
      options: ['1', '2', '3', '4'], correctIndex: 1,
    },
    {
      id: 'q-c-bnd-m1', conceptId: 'c-chem-bonding', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What type of intermolecular force is responsible for the unusually high boiling point of water?',
      options: ['London dispersion forces', 'Dipole-induced dipole', 'Hydrogen bonding', 'Ionic lattice forces'], correctIndex: 2,
    },
    {
      id: 'q-c-bnd-m2', conceptId: 'c-chem-bonding', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the hybridization of the central carbon in ethene (H₂C=CH₂)?',
      options: ['sp', 'sp²', 'sp³', 'sp³d'], correctIndex: 1,
    },
    {
      id: 'q-c-bnd-h1', conceptId: 'c-chem-bonding', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'According to Molecular Orbital (MO) theory, the bond order of oxygen molecule O₂ is:',
      options: ['1', '2', '3', '2.5'], correctIndex: 1,
    },
    {
      id: 'q-c-bnd-h2', conceptId: 'c-chem-bonding', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Why is carbon dioxide (CO₂) nonpolar even though each C=O bond is polar?',
      options: [
        'The electronegativity difference is zero',
        'It has a linear geometry where dipole moments cancel out',
        'Carbon donates electrons completely',
        'Oxygen atoms carry positive charges'
      ],
      correctIndex: 1,
    },

    // 4. Stoichiometry
    {
      id: 'q-c-stk-d1', conceptId: 'c-chem-stoichiometry', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is Avogadro\'s number (number of particles in one mole)?',
      options: ['6.022 × 10²³', '3.00 × 10⁸', '9.81 × 10¹', '1.602 × 10⁻¹⁹'], correctIndex: 0,
    },
    {
      id: 'q-c-stk-d2', conceptId: 'c-chem-stoichiometry', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'What is the molar mass of water (H₂O)? (H = 1 g/mol, O = 16 g/mol)',
      options: ['17 g/mol', '18 g/mol', '34 g/mol', '16 g/mol'], correctIndex: 1,
    },
    {
      id: 'q-c-stk-e1', conceptId: 'c-chem-stoichiometry', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In a chemical reaction, the limiting reactant is the substance that:',
      options: [
        'Is present in the largest quantity',
        'Is completely consumed first and limits product formation',
        'Does not react at all',
        'Acts as a catalyst'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-c-stk-e2', conceptId: 'c-chem-stoichiometry', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Molarity (M) of a solution is defined as:',
      options: ['Moles of solute / Liters of solution', 'Grams of solute / Liters of solvent', 'Moles of solute / kg of solvent', 'Grams of solute / Total grams'], correctIndex: 0,
    },
    {
      id: 'q-c-stk-m1', conceptId: 'c-chem-stoichiometry', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In the reaction 2H₂ + O₂ → 2H₂O, how many moles of H₂O are produced from 4 moles of H₂ with excess O₂?',
      options: ['2 moles', '4 moles', '8 moles', '1 mole'], correctIndex: 1,
    },
    {
      id: 'q-c-stk-m2', conceptId: 'c-chem-stoichiometry', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Percent yield is calculated as:',
      options: [
        '(Theoretical Yield / Actual Yield) × 100%',
        '(Actual Yield / Theoretical Yield) × 100%',
        '(Limiting Reactant / Excess Reactant) × 100%',
        '(Total Mass / Volume) × 100%'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-c-stk-h1', conceptId: 'c-chem-stoichiometry', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What volume of CO₂ at STP (22.4 L/mol) is generated from the complete combustion of 1 mole of propane (C₃H₈ + 5O₂ → 3CO₂ + 4H₂O)?',
      options: ['22.4 L', '44.8 L', '67.2 L', '112.0 L'], correctIndex: 2,
    },
    {
      id: 'q-c-stk-h2', conceptId: 'c-chem-stoichiometry', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A compound is 40.0% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass. Its empirical formula is:',
      options: ['CH₂O', 'C₂H₄O₂', 'CHO', 'CH₄O'], correctIndex: 0,
    },

    // 5. Types of Chemical Reactions
    {
      id: 'q-c-rxn-d1', conceptId: 'c-chem-reactions', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'The reaction 2Mg + O₂ → 2MgO is an example of which type of reaction?',
      options: ['Decomposition', 'Synthesis (Combination)', 'Single replacement', 'Double replacement'], correctIndex: 1,
    },
    {
      id: 'q-c-rxn-d2', conceptId: 'c-chem-reactions', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'In a redox reaction, oxidation refers to the:',
      options: ['Gain of electrons', 'Loss of electrons', 'Gain of protons', 'Loss of neutrons'], correctIndex: 1,
    },
    {
      id: 'q-c-rxn-e1', conceptId: 'c-chem-reactions', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The reaction CaCO₃ → CaO + CO₂ is classified as:',
      options: ['Synthesis', 'Decomposition', 'Combustion', 'Neutralization'], correctIndex: 1,
    },
    {
      id: 'q-c-rxn-e2', conceptId: 'c-chem-reactions', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'An exothermic reaction is one that:',
      options: ['Absorbs heat from surroundings', 'Releases heat to surroundings', 'Requires a catalyst', 'Occurs only at 0 K'], correctIndex: 1,
    },
    {
      id: 'q-c-rxn-m1', conceptId: 'c-chem-reactions', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In the single replacement reaction Zn + 2HCl → ZnCl₂ + H₂, what is oxidized?',
      options: ['Zn (from 0 to +2)', 'H (from +1 to 0)', 'Cl (from -1 to 0)', 'Nothing is oxidized'], correctIndex: 0,
    },
    {
      id: 'q-c-rxn-m2', conceptId: 'c-chem-reactions', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'According to Le Chatelier\'s Principle, if an exothermic reaction at equilibrium is heated, the system will:',
      options: ['Shift toward products', 'Shift toward reactants', 'Not change', 'Double the equilibrium constant'], correctIndex: 1,
    },
    {
      id: 'q-c-rxn-h1', conceptId: 'c-chem-reactions', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'In the Arrhenius equation k = A · e^(-E_a / (RT)), what does E_a represent?',
      options: ['Equilibrium constant', 'Activation energy', 'Enthalpy change', 'Entropy change'], correctIndex: 1,
    },
    {
      id: 'q-c-rxn-h2', conceptId: 'c-chem-reactions', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the oxidation state of Chromium in the dichromate ion Cr₂O₇²⁻?',
      options: ['+3', '+6', '+7', '+12'], correctIndex: 1,
    },

    // 6. Acids, Bases & pH
    {
      id: 'q-c-ab-d1', conceptId: 'c-chem-acids-bases', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: true,
      prompt: 'A solution with a pH of 3 is considered:',
      options: ['Acidic', 'Basic (alkaline)', 'Neutral', 'Insoluble'], correctIndex: 0,
    },
    {
      id: 'q-c-ab-d2', conceptId: 'c-chem-acids-bases', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: true,
      prompt: 'According to the Brønsted-Lowry definition, an acid is a:',
      options: ['Proton (H⁺) acceptor', 'Proton (H⁺) donor', 'Electron pair donor', 'Hydroxide (OH⁻) donor'], correctIndex: 1,
    },
    {
      id: 'q-c-ab-e1', conceptId: 'c-chem-acids-bases', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the pH of pure water at 25 °C?',
      options: ['0', '7', '14', '1'], correctIndex: 1,
    },
    {
      id: 'q-c-ab-e2', conceptId: 'c-chem-acids-bases', difficulty: 'EASY' as DifficultyLevel, isDiagnostic: false,
      prompt: 'Which of the following is a common strong acid?',
      options: ['CH₃COOH (Acetic acid)', 'HCl (Hydrochloric acid)', 'H₂CO₃ (Carbonic acid)', 'H₂O (Water)'], correctIndex: 1,
    },
    {
      id: 'q-c-ab-m1', conceptId: 'c-chem-acids-bases', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the pH of a 0.001 M HCl solution?',
      options: ['1', '2', '3', '11'], correctIndex: 2,
    },
    {
      id: 'q-c-ab-m2', conceptId: 'c-chem-acids-bases', difficulty: 'MEDIUM' as DifficultyLevel, isDiagnostic: false,
      prompt: 'A buffer solution resists changes in pH when small amounts of acid or base are added. It typically consists of:',
      options: [
        'A strong acid and a strong base',
        'A weak acid and its conjugate base',
        'Pure distilled water',
        'A concentrated salt only'
      ],
      correctIndex: 1,
    },
    {
      id: 'q-c-ab-h1', conceptId: 'c-chem-acids-bases', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'The Henderson-Hasselbalch equation for an acid buffer is:',
      options: [
        'pH = pKa + log([A⁻] / [HA])',
        'pH = pKa - log([A⁻] / [HA])',
        'pH = pKb + log([HA] / [A⁻])',
        'pH = -log([H⁺]) + pKa'
      ],
      correctIndex: 0,
    },
    {
      id: 'q-c-ab-h2', conceptId: 'c-chem-acids-bases', difficulty: 'HARD' as DifficultyLevel, isDiagnostic: false,
      prompt: 'What is the conjugate base of the bicarbonate ion (HCO₃⁻)?',
      options: ['H₂CO₃', 'CO₃²⁻', 'H⁺', 'OH⁻'], correctIndex: 1,
    },
  ]

  console.log(`  Upserting ${allQuestions.length} questions...`)
  for (const q of allQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        conceptId: q.conceptId,
        difficulty: q.difficulty,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        isDiagnostic: q.isDiagnostic,
      },
      create: q,
    })
  }

  // ============================================================
  // 6. Demo Students
  // ============================================================
  const strongStudent = await prisma.student.upsert({
    where: { id: 'student-strong' },
    update: { name: 'Alex (Strong Demo)' },
    create: { id: 'student-strong', name: 'Alex (Strong Demo)' },
  })

  const weakStudent = await prisma.student.upsert({
    where: { id: 'student-weak' },
    update: { name: 'Jordan (Weak Demo)' },
    create: { id: 'student-weak', name: 'Jordan (Weak Demo)' },
  })

  await prisma.student.upsert({
    where: { id: 'student-fresh' },
    update: { name: 'New Student (Live Demo)' },
    create: { id: 'student-fresh', name: 'New Student (Live Demo)' },
  })

  // ============================================================
  // 7. Seed StudentConceptPerformance for demo students
  // ============================================================
  // Strong student in Data Structures
  const strongPerfDS = [
    { conceptId: 'c-arrays',      score: 90 },
    { conceptId: 'c-linkedlists', score: 85 },
    { conceptId: 'c-stacks',      score: 80 },
    { conceptId: 'c-queues',      score: 82 },
    { conceptId: 'c-trees',       score: 75 },
    { conceptId: 'c-binarytrees', score: 72 },
    { conceptId: 'c-traversal',   score: 70 },
  ]

  for (const p of strongPerfDS) {
    let mastery = 0
    for (let i = 0; i < 10; i++) {
      const sessionScore = i < 3 ? p.score - 10 : i < 7 ? p.score : p.score + 2
      mastery = applyMasteryFormula(mastery, Math.min(100, sessionScore))
    }
    const finalMastery = Math.min(100, mastery)

    await prisma.studentConceptPerformance.upsert({
      where: { studentId_conceptId: { studentId: strongStudent.id, conceptId: p.conceptId } },
      update: {
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 10,
      },
      create: {
        studentId: strongStudent.id,
        conceptId: p.conceptId,
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 10,
      },
    })
  }

  // Weak student in Data Structures
  const weakPerfDS = [
    { conceptId: 'c-arrays',      score: 30 },
    { conceptId: 'c-linkedlists', score: 25 },
    { conceptId: 'c-stacks',      score: 20 },
    { conceptId: 'c-queues',      score: 35 },
    { conceptId: 'c-trees',       score: 15 },
    { conceptId: 'c-binarytrees', score: 10 },
    { conceptId: 'c-traversal',   score: 10 },
  ]

  for (const p of weakPerfDS) {
    const m1 = applyMasteryFormula(0, p.score + 5)
    const m2 = applyMasteryFormula(m1, p.score)
    const m3 = applyMasteryFormula(m2, p.score - 3)
    const finalMastery = Math.max(0, m3)

    await prisma.studentConceptPerformance.upsert({
      where: { studentId_conceptId: { studentId: weakStudent.id, conceptId: p.conceptId } },
      update: {
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 3,
      },
      create: {
        studentId: weakStudent.id,
        conceptId: p.conceptId,
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 3,
      },
    })
  }

  // Strong student in Mathematics (Algebra strong, Calculus developing)
  const strongPerfMath = [
    { conceptId: 'c-math-linear-eq',    score: 95 },
    { conceptId: 'c-math-quadratic-eq', score: 90 },
    { conceptId: 'c-math-functions',    score: 85 },
    { conceptId: 'c-math-limits',       score: 75 },
    { conceptId: 'c-math-derivatives',  score: 70 },
    { conceptId: 'c-math-integrals',    score: 65 },
  ]

  for (const p of strongPerfMath) {
    let mastery = 0
    for (let i = 0; i < 8; i++) {
      mastery = applyMasteryFormula(mastery, p.score)
    }
    const finalMastery = Math.min(100, mastery)
    await prisma.studentConceptPerformance.upsert({
      where: { studentId_conceptId: { studentId: strongStudent.id, conceptId: p.conceptId } },
      update: {
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 8,
      },
      create: {
        studentId: strongStudent.id,
        conceptId: p.conceptId,
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 8,
      },
    })
  }

  // Weak student in Mathematics (Gaps across the board)
  const weakPerfMath = [
    { conceptId: 'c-math-linear-eq',    score: 35 },
    { conceptId: 'c-math-quadratic-eq', score: 20 },
    { conceptId: 'c-math-functions',    score: 15 },
    { conceptId: 'c-math-limits',       score: 10 },
    { conceptId: 'c-math-derivatives',  score: 10 },
    { conceptId: 'c-math-integrals',    score: 5 },
  ]

  for (const p of weakPerfMath) {
    const finalMastery = applyMasteryFormula(0, p.score)
    await prisma.studentConceptPerformance.upsert({
      where: { studentId_conceptId: { studentId: weakStudent.id, conceptId: p.conceptId } },
      update: {
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 2,
      },
      create: {
        studentId: weakStudent.id,
        conceptId: p.conceptId,
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 2,
      },
    })
  }

  // ============================================================
  // 8. Generate Initial Learning Paths for demo students
  // ============================================================
  await generateSeedLearningPath(strongStudent.id, dsSubject.id)
  await generateSeedLearningPath(weakStudent.id, dsSubject.id)
  await generateSeedLearningPath(strongStudent.id, mathSubject.id)
  await generateSeedLearningPath(weakStudent.id, mathSubject.id)

  console.log('✅ Multi-subject seeding complete!')
  console.log('  Subjects: Data Structures, Mathematics, Physics, Chemistry')
  console.log('  Concepts: 25 total (7 DS + 6 Math + 6 Physics + 6 Chem)')
  console.log('  Questions: 200 total (56 DS + 48 Math + 48 Physics + 48 Chem)')
}

async function generateSeedLearningPath(studentId: string, subjectId: string) {
  await prisma.learningPath.updateMany({
    where: { studentId, subjectId, isCurrent: true },
    data: { isCurrent: false },
  })

  const performances = await prisma.studentConceptPerformance.findMany({
    where: {
      studentId,
      concept: { topic: { subjectId } },
    },
    include: { concept: true },
  })

  if (performances.length === 0) return null

  const prereqs = await prisma.conceptPrerequisite.findMany()
  const perfMap = new Map(performances.map(p => [p.conceptId, p]))

  const items: Array<{ conceptId: string; status: MasteryStatus; prerequisiteBlocked: boolean; masteryPercent: number; name: string }> = []

  for (const perf of performances) {
    const prereqsForConcept = prereqs.filter(e => e.conceptId === perf.conceptId)
    const prerequisiteBlocked = prereqsForConcept.some(e => {
      const prereqPerf = perfMap.get(e.prerequisiteId)
      return !prereqPerf || prereqPerf.status !== 'STRONG'
    })
    items.push({
      conceptId: perf.conceptId,
      name: perf.concept.name,
      status: perf.status,
      prerequisiteBlocked,
      masteryPercent: perf.masteryPercent,
    })
  }

  const sorted = items.sort((a, b) => {
    const priority = (item: typeof items[0]) => {
      if (item.status === 'GAP' && !item.prerequisiteBlocked) return 0
      if (item.status === 'GAP' && item.prerequisiteBlocked) return 1
      if (item.status === 'DEVELOPING' && !item.prerequisiteBlocked) return 2
      if (item.status === 'DEVELOPING' && item.prerequisiteBlocked) return 3
      return 4
    }
    const pa = priority(a)
    const pb = priority(b)
    if (pa !== pb) return pa - pb
    return a.masteryPercent - b.masteryPercent
  })

  const path = await prisma.learningPath.create({
    data: {
      studentId,
      subjectId,
      isCurrent: true,
      items: {
        create: sorted.map((item, idx) => {
          const prereqsForConcept = prereqs.filter(e => e.conceptId === item.conceptId)
          const blockedBy = prereqsForConcept
            .filter(e => {
              const prereqPerf = perfMap.get(e.prerequisiteId)
              return !prereqPerf || prereqPerf.status !== 'STRONG'
            })
            .map(e => {
              const p = performances.find(pp => pp.conceptId === e.prerequisiteId)
              return p?.concept?.name ?? e.prerequisiteId
            })

          let reason = ''
          if (item.status === 'GAP' && !item.prerequisiteBlocked) {
            reason = 'Knowledge gap — practice needed'
          } else if (item.status === 'GAP' && item.prerequisiteBlocked) {
            reason = `Knowledge gap (prerequisite gap: ${blockedBy.join(', ')})`
          } else if (item.status === 'DEVELOPING' && !item.prerequisiteBlocked) {
            reason = 'Developing — needs more practice'
          } else if (item.status === 'DEVELOPING' && item.prerequisiteBlocked) {
            reason = `Developing (prerequisite gap: ${blockedBy.join(', ')})`
          } else {
            reason = 'Strong — optional review'
          }

          return {
            conceptId: item.conceptId,
            orderIndex: idx,
            reason,
          }
        }),
      },
    },
  })

  return path
}

main()
  .catch(e => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
