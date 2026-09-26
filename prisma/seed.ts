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
  console.log('🌱 Seeding database...')

  // ============================================================
  // 1. Subject + Topics + Concepts
  // ============================================================
  const subject = await prisma.subject.upsert({
    where: { name: 'Data Structures' },
    update: {},
    create: { name: 'Data Structures' },
  })

  const linearTopic = await prisma.topic.upsert({
    where: { id: 'topic-linear' },
    update: {},
    create: { id: 'topic-linear', name: 'Linear Structures', subjectId: subject.id },
  })

  const treeTopic = await prisma.topic.upsert({
    where: { id: 'topic-tree' },
    update: {},
    create: { id: 'topic-tree', name: 'Tree Structures', subjectId: subject.id },
  })

  // 7 concepts with stable IDs for easy reference
  const conceptData = [
    { id: 'c-arrays',        name: 'Arrays',         topicId: linearTopic.id },
    { id: 'c-linkedlists',   name: 'Linked Lists',   topicId: linearTopic.id },
    { id: 'c-stacks',        name: 'Stacks',         topicId: linearTopic.id },
    { id: 'c-queues',        name: 'Queues',         topicId: linearTopic.id },
    { id: 'c-trees',         name: 'Trees',          topicId: treeTopic.id },
    { id: 'c-binarytrees',   name: 'Binary Trees',   topicId: treeTopic.id },
    { id: 'c-traversal',     name: 'Tree Traversal', topicId: treeTopic.id },
  ]

  for (const c of conceptData) {
    await prisma.concept.upsert({
      where: { id: c.id },
      update: { name: c.name, topicId: c.topicId },
      create: c,
    })
  }

  // ============================================================
  // 2. Prerequisite edges (per PROJECT_SPEC.md §8)
  // ============================================================
  const prereqEdges = [
    { conceptId: 'c-linkedlists', prerequisiteId: 'c-arrays' },    // Arrays → Linked Lists
    { conceptId: 'c-stacks',      prerequisiteId: 'c-linkedlists' }, // Linked Lists → Stacks
    { conceptId: 'c-queues',      prerequisiteId: 'c-linkedlists' }, // Linked Lists → Queues
    { conceptId: 'c-binarytrees', prerequisiteId: 'c-trees' },       // Trees → Binary Trees
    { conceptId: 'c-traversal',   prerequisiteId: 'c-binarytrees' }, // Binary Trees → Tree Traversal
  ]

  for (const edge of prereqEdges) {
    await prisma.conceptPrerequisite.upsert({
      where: { conceptId_prerequisiteId: edge },
      update: {},
      create: { id: `prereq-${edge.conceptId}-${edge.prerequisiteId}`, ...edge },
    })
  }

  // ============================================================
  // 3. Questions
  // ============================================================
  // Diagnostic questions: isDiagnostic=true, 2 per concept = 14 total
  // Quiz questions: at least 6 per concept (2 per difficulty level) = 42 total
  // We'll seed both in one block. Total per concept: 8 questions (2 diag + 6 quiz)

  const questions = [
    // ---- ARRAYS ----
    {
      id: 'q-arr-d1', conceptId: 'c-arrays', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'What is the time complexity of accessing an element by index in an array?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      correctIndex: 2,
    },
    {
      id: 'q-arr-d2', conceptId: 'c-arrays', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'Which of the following is true about arrays in most programming languages?',
      options: [
        'Arrays can grow dynamically without any overhead',
        'Arrays store elements in contiguous memory locations',
        'Array elements must all be of different types',
        'Arrays do not support index-based access',
      ],
      correctIndex: 1,
    },
    {
      id: 'q-arr-e1', conceptId: 'c-arrays', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'What is the index of the first element in a zero-indexed array?',
      options: ['1', '0', '-1', 'Depends on the language'],
      correctIndex: 1,
    },
    {
      id: 'q-arr-e2', conceptId: 'c-arrays', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Which operation on an array has O(n) time complexity in the worst case?',
      options: ['Accessing an element by index', 'Finding the length', 'Inserting at the beginning', 'Reading the last element'],
      correctIndex: 2,
    },
    {
      id: 'q-arr-m1', conceptId: 'c-arrays', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'What happens when you insert an element at the beginning of an array?',
      options: [
        'All elements shift right by one position',
        'The array automatically resizes',
        'Only the first element is replaced',
        'Nothing — arrays are immutable',
      ],
      correctIndex: 0,
    },
    {
      id: 'q-arr-m2', conceptId: 'c-arrays', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A 2D array of size m×n stores how many elements total?',
      options: ['m + n', 'm × n', 'm² + n²', '2(m + n)'],
      correctIndex: 1,
    },
    {
      id: 'q-arr-h1', conceptId: 'c-arrays', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'In a sorted array of n elements, binary search requires at most how many comparisons?',
      options: ['n', 'n/2', 'log₂(n) + 1', 'n²'],
      correctIndex: 2,
    },
    {
      id: 'q-arr-h2', conceptId: 'c-arrays', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Which sorting algorithm has O(n²) worst-case but O(n log n) average-case complexity?',
      options: ['Merge Sort', 'Bubble Sort', 'Quick Sort', 'Insertion Sort'],
      correctIndex: 2,
    },

    // ---- LINKED LISTS ----
    {
      id: 'q-ll-d1', conceptId: 'c-linkedlists', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'What does each node in a singly linked list contain?',
      options: [
        'Only data',
        'Data and a pointer to the next node',
        'Data and pointers to both next and previous nodes',
        'Only a pointer to the next node',
      ],
      correctIndex: 1,
    },
    {
      id: 'q-ll-d2', conceptId: 'c-linkedlists', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'What is the time complexity of searching for an element in an unsorted linked list?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 2,
    },
    {
      id: 'q-ll-e1', conceptId: 'c-linkedlists', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Which node in a linked list holds a null pointer?',
      options: ['Head', 'Middle', 'Tail', 'All nodes'],
      correctIndex: 2,
    },
    {
      id: 'q-ll-e2', conceptId: 'c-linkedlists', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A doubly linked list node has pointers to:',
      options: ['Next only', 'Previous only', 'Both next and previous', 'Neither'],
      correctIndex: 2,
    },
    {
      id: 'q-ll-m1', conceptId: 'c-linkedlists', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Inserting a node at the head of a singly linked list is:',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      correctIndex: 2,
    },
    {
      id: 'q-ll-m2', conceptId: 'c-linkedlists', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'To delete the kth node in a singly linked list, you need access to:',
      options: ['The kth node only', 'The (k-1)th node', 'The head only', 'All nodes'],
      correctIndex: 1,
    },
    {
      id: 'q-ll-h1', conceptId: 'c-linkedlists', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Floyd\'s cycle detection algorithm uses:',
      options: [
        'Two pointers moving at different speeds',
        'A hash set to track visited nodes',
        'Recursive DFS',
        'Sorting the list first',
      ],
      correctIndex: 0,
    },
    {
      id: 'q-ll-h2', conceptId: 'c-linkedlists', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Reversing a singly linked list in-place has time complexity:',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correctIndex: 2,
    },

    // ---- STACKS ----
    {
      id: 'q-stk-d1', conceptId: 'c-stacks', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'A stack follows which principle?',
      options: ['FIFO (First In, First Out)', 'LIFO (Last In, First Out)', 'Random access', 'Priority-based access'],
      correctIndex: 1,
    },
    {
      id: 'q-stk-d2', conceptId: 'c-stacks', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'Which of the following is a typical application of a stack?',
      options: ['BFS traversal', 'Undo/redo functionality', 'Round-robin scheduling', 'Priority queue'],
      correctIndex: 1,
    },
    {
      id: 'q-stk-e1', conceptId: 'c-stacks', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Which operation adds an element to the top of a stack?',
      options: ['pop', 'push', 'enqueue', 'insert'],
      correctIndex: 1,
    },
    {
      id: 'q-stk-e2', conceptId: 'c-stacks', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'What does "peek" (or "top") do on a stack?',
      options: ['Removes the top element', 'Returns the top element without removing it', 'Adds to the bottom', 'Reverses the stack'],
      correctIndex: 1,
    },
    {
      id: 'q-stk-m1', conceptId: 'c-stacks', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Checking balanced parentheses uses a stack because:',
      options: [
        'Stacks allow random access',
        'The most recently opened bracket must be closed first (LIFO)',
        'Stacks are sorted',
        'Stacks have O(1) search',
      ],
      correctIndex: 1,
    },
    {
      id: 'q-stk-m2', conceptId: 'c-stacks', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'The call stack in programming handles function calls in which order?',
      options: ['FIFO', 'LIFO', 'Alphabetical', 'Random'],
      correctIndex: 1,
    },
    {
      id: 'q-stk-h1', conceptId: 'c-stacks', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Implementing a queue using two stacks results in amortized time complexity of:',
      options: ['O(n) per operation', 'O(1) amortized per operation', 'O(log n) per operation', 'O(n²) per operation'],
      correctIndex: 1,
    },
    {
      id: 'q-stk-h2', conceptId: 'c-stacks', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'In a monotonic stack, elements are maintained in:',
      options: ['Random order', 'Sorted order (ascending or descending)', 'FIFO order', 'Hash order'],
      correctIndex: 1,
    },

    // ---- QUEUES ----
    {
      id: 'q-que-d1', conceptId: 'c-queues', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'A queue follows which principle?',
      options: ['LIFO', 'FIFO', 'Random', 'Priority'],
      correctIndex: 1,
    },
    {
      id: 'q-que-d2', conceptId: 'c-queues', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'Which data structure would you use for Breadth-First Search (BFS)?',
      options: ['Stack', 'Queue', 'Heap', 'Hash Map'],
      correctIndex: 1,
    },
    {
      id: 'q-que-e1', conceptId: 'c-queues', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Which operation removes an element from a queue?',
      options: ['push', 'pop', 'dequeue', 'peek'],
      correctIndex: 2,
    },
    {
      id: 'q-que-e2', conceptId: 'c-queues', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Elements are added to a queue at the:',
      options: ['Front', 'Rear (back)', 'Middle', 'Random position'],
      correctIndex: 1,
    },
    {
      id: 'q-que-m1', conceptId: 'c-queues', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A circular queue overcomes which limitation of a simple array queue?',
      options: [
        'Slow access times',
        'Memory waste when front pointer advances and rear space is unused',
        'Inability to store duplicates',
        'Lack of FIFO ordering',
      ],
      correctIndex: 1,
    },
    {
      id: 'q-que-m2', conceptId: 'c-queues', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A priority queue serves elements based on:',
      options: ['Insertion order', 'Priority value', 'Alphabetical order', 'Random selection'],
      correctIndex: 1,
    },
    {
      id: 'q-que-h1', conceptId: 'c-queues', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'In a deque (double-ended queue), you can:',
      options: [
        'Insert and delete only at the rear',
        'Insert and delete only at the front',
        'Insert and delete at both front and rear',
        'Only read elements, not insert or delete',
      ],
      correctIndex: 2,
    },
    {
      id: 'q-que-h2', conceptId: 'c-queues', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Sliding window maximum problem is solved efficiently using:',
      options: ['Simple queue', 'Stack', 'Deque (monotonic)', 'Circular buffer'],
      correctIndex: 2,
    },

    // ---- TREES ----
    {
      id: 'q-tr-d1', conceptId: 'c-trees', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'In a tree, a node with no children is called a:',
      options: ['Root', 'Parent', 'Leaf', 'Branch'],
      correctIndex: 2,
    },
    {
      id: 'q-tr-d2', conceptId: 'c-trees', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'The height of a tree with a single root node (no children) is:',
      options: ['0', '1', '-1', 'Undefined'],
      correctIndex: 0,
    },
    {
      id: 'q-tr-e1', conceptId: 'c-trees', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'The topmost node in a tree is called the:',
      options: ['Leaf', 'Child', 'Root', 'Parent'],
      correctIndex: 2,
    },
    {
      id: 'q-tr-e2', conceptId: 'c-trees', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'An edge in a tree connects:',
      options: ['Two roots', 'A parent and a child', 'Two leaves', 'Two siblings'],
      correctIndex: 1,
    },
    {
      id: 'q-tr-m1', conceptId: 'c-trees', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A tree with n nodes has exactly how many edges?',
      options: ['n', 'n-1', 'n+1', '2n'],
      correctIndex: 1,
    },
    {
      id: 'q-tr-m2', conceptId: 'c-trees', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'The depth of the root node in any tree is:',
      options: ['1', '-1', '0', 'Depends on tree size'],
      correctIndex: 2,
    },
    {
      id: 'q-tr-h1', conceptId: 'c-trees', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'An AVL tree maintains balance by ensuring:',
      options: [
        'All leaves are at the same level',
        'The height difference between left and right subtrees is at most 1',
        'Each node has exactly 2 children',
        'Nodes are stored in sorted order',
      ],
      correctIndex: 1,
    },
    {
      id: 'q-tr-h2', conceptId: 'c-trees', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'In a B-Tree of order m, each internal node has at most:',
      options: ['m children', 'm-1 children', 'm+1 children', '2m children'],
      correctIndex: 0,
    },

    // ---- BINARY TREES ----
    {
      id: 'q-bt-d1', conceptId: 'c-binarytrees', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'In a binary tree, each node has at most how many children?',
      options: ['1', '2', '3', 'Unlimited'],
      correctIndex: 1,
    },
    {
      id: 'q-bt-d2', conceptId: 'c-binarytrees', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'In a Binary Search Tree (BST), for any node, its left subtree contains values that are:',
      options: ['Greater than the node', 'Less than the node', 'Equal to the node', 'Random'],
      correctIndex: 1,
    },
    {
      id: 'q-bt-e1', conceptId: 'c-binarytrees', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A full binary tree is one where every node has:',
      options: ['Exactly 2 children', '0 or 2 children (never 1)', 'At most 2 children', 'At least 1 child'],
      correctIndex: 1,
    },
    {
      id: 'q-bt-e2', conceptId: 'c-binarytrees', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A complete binary tree has all levels filled except possibly the last, which is:',
      options: ['Empty', 'Filled from right to left', 'Filled from left to right', 'Random'],
      correctIndex: 2,
    },
    {
      id: 'q-bt-m1', conceptId: 'c-binarytrees', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'The maximum number of nodes in a binary tree of height h is:',
      options: ['h', '2h', '2^(h+1) - 1', 'h²'],
      correctIndex: 2,
    },
    {
      id: 'q-bt-m2', conceptId: 'c-binarytrees', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Searching in a balanced BST has time complexity:',
      options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
      correctIndex: 2,
    },
    {
      id: 'q-bt-h1', conceptId: 'c-binarytrees', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'A Red-Black Tree guarantees that operations (insert, delete, search) run in:',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 1,
    },
    {
      id: 'q-bt-h2', conceptId: 'c-binarytrees', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Serializing a binary tree to reconstruct it uniquely requires:',
      options: [
        'Inorder traversal only',
        'Preorder traversal only',
        'Either preorder or postorder + inorder, or level-order with nulls',
        'Postorder only',
      ],
      correctIndex: 2,
    },

    // ---- TREE TRAVERSAL ----
    {
      id: 'q-tv-d1', conceptId: 'c-traversal', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'In-order traversal of a BST visits nodes in which order?',
      options: ['Root, Left, Right', 'Left, Root, Right', 'Left, Right, Root', 'Right, Root, Left'],
      correctIndex: 1,
    },
    {
      id: 'q-tv-d2', conceptId: 'c-traversal', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: true,
      prompt: 'Which traversal visits the root node LAST?',
      options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
      correctIndex: 2,
    },
    {
      id: 'q-tv-e1', conceptId: 'c-traversal', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Pre-order traversal visits nodes in the order:',
      options: ['Left, Root, Right', 'Root, Left, Right', 'Left, Right, Root', 'Right, Left, Root'],
      correctIndex: 1,
    },
    {
      id: 'q-tv-e2', conceptId: 'c-traversal', difficulty: 'EASY' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Level-order (BFS) traversal uses which data structure?',
      options: ['Stack', 'Heap', 'Queue', 'Linked List'],
      correctIndex: 2,
    },
    {
      id: 'q-tv-m1', conceptId: 'c-traversal', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Post-order traversal is typically used for:',
      options: ['Printing a sorted BST', 'Deleting a tree (process children before parent)', 'Level-by-level printing', 'Finding the root'],
      correctIndex: 1,
    },
    {
      id: 'q-tv-m2', conceptId: 'c-traversal', difficulty: 'MEDIUM' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Given a BST, which traversal produces values in ascending sorted order?',
      options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
      correctIndex: 2,
    },
    {
      id: 'q-tv-h1', conceptId: 'c-traversal', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'Morris traversal achieves in-order traversal with:',
      options: ['O(n) space using a stack', 'O(n) space using a queue', 'O(1) extra space by threading the tree', 'O(log n) space'],
      correctIndex: 2,
    },
    {
      id: 'q-tv-h2', conceptId: 'c-traversal', difficulty: 'HARD' as DifficultyLevel,
      isDiagnostic: false,
      prompt: 'To reconstruct a unique binary tree, you need:',
      options: [
        'Inorder only',
        'Preorder only',
        'Inorder + Preorder, or Inorder + Postorder',
        'Level-order only',
      ],
      correctIndex: 2,
    },
  ]

  for (const q of questions) {
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
  // 4. Demo Students
  // ============================================================

  // Student 1: Strong performer (pre-seeded high mastery)
  const strongStudent = await prisma.student.upsert({
    where: { id: 'student-strong' },
    update: { name: 'Alex (Strong Demo)' },
    create: { id: 'student-strong', name: 'Alex (Strong Demo)' },
  })

  // Student 2: Weak performer (pre-seeded low mastery)
  const weakStudent = await prisma.student.upsert({
    where: { id: 'student-weak' },
    update: { name: 'Jordan (Weak Demo)' },
    create: { id: 'student-weak', name: 'Jordan (Weak Demo)' },
  })

  // Student 3: Fresh student for live demo
  await prisma.student.upsert({
    where: { id: 'student-fresh' },
    update: { name: 'New Student (Live Demo)' },
    create: { id: 'student-fresh', name: 'New Student (Live Demo)' },
  })

  // ============================================================
  // 5. Seed StudentConceptPerformance for demo students
  // ============================================================

  // Strong student performance: Arrays=90, LinkedLists=85, Stacks=80, Queues=82, Trees=75, BinaryTrees=72, Traversal=70
  const strongPerf = [
    { conceptId: 'c-arrays',      score: 90 },
    { conceptId: 'c-linkedlists', score: 85 },
    { conceptId: 'c-stacks',      score: 80 },
    { conceptId: 'c-queues',      score: 82 },
    { conceptId: 'c-trees',       score: 75 },
    { conceptId: 'c-binarytrees', score: 72 },
    { conceptId: 'c-traversal',   score: 70 },
  ]

  for (const p of strongPerf) {
    // Simulate 3 attempts averaging high
    const m1 = applyMasteryFormula(0, p.score - 5)
    const m2 = applyMasteryFormula(m1, p.score)
    const m3 = applyMasteryFormula(m2, p.score + 2)
    const finalMastery = Math.min(100, m3)

    await prisma.studentConceptPerformance.upsert({
      where: { studentId_conceptId: { studentId: strongStudent.id, conceptId: p.conceptId } },
      update: {
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 3,
      },
      create: {
        studentId: strongStudent.id,
        conceptId: p.conceptId,
        masteryPercent: finalMastery,
        status: computeStatus(finalMastery),
        lastScorePercent: p.score,
        attemptsCount: 3,
      },
    })
  }

  // Weak student performance: Arrays=30, LinkedLists=25, Stacks=20, Queues=35, Trees=15, BinaryTrees=10, Traversal=10
  const weakPerf = [
    { conceptId: 'c-arrays',      score: 30 },
    { conceptId: 'c-linkedlists', score: 25 },
    { conceptId: 'c-stacks',      score: 20 },
    { conceptId: 'c-queues',      score: 35 },
    { conceptId: 'c-trees',       score: 15 },
    { conceptId: 'c-binarytrees', score: 10 },
    { conceptId: 'c-traversal',   score: 10 },
  ]

  for (const p of weakPerf) {
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

  // ============================================================
  // 6. Generate Learning Paths for seeded demo students
  //    (same logic as Path Generator in the app)
  // ============================================================
  await generateSeedLearningPath(strongStudent.id)
  await generateSeedLearningPath(weakStudent.id)

  console.log('✅ Seeding complete!')
  console.log('  Students: Alex (Strong), Jordan (Weak), New Student (Live Demo)')
  console.log('  Concepts: 7')
  console.log('  Prerequisite edges: 5')
  console.log('  Diagnostic questions: 14 (2 per concept)')
  console.log('  Quiz questions: 42 (6 per concept: 2 Easy, 2 Medium, 2 Hard)')
}

async function generateSeedLearningPath(studentId: string) {
  // Mark existing paths as not current
  await prisma.learningPath.updateMany({
    where: { studentId, isCurrent: true },
    data: { isCurrent: false },
  })

  const performances = await prisma.studentConceptPerformance.findMany({
    where: { studentId },
    include: { concept: { include: { prerequisiteOf: true, requiredFor: true } } },
  })

  const prereqs = await prisma.conceptPrerequisite.findMany()

  const perfMap = new Map(performances.map(p => [p.conceptId, p]))

  // Determine prerequisiteBlocked
  const items: Array<{ conceptId: string; status: MasteryStatus; prerequisiteBlocked: boolean; masteryPercent: number }> = []

  for (const perf of performances) {
    const prereqsForConcept = prereqs.filter(e => e.conceptId === perf.conceptId)
    const prerequisiteBlocked = prereqsForConcept.some(e => {
      const prereqPerf = perfMap.get(e.prerequisiteId)
      return !prereqPerf || prereqPerf.status !== 'STRONG'
    })
    items.push({
      conceptId: perf.conceptId,
      status: perf.status,
      prerequisiteBlocked,
      masteryPercent: perf.masteryPercent,
    })
  }

  // Sort per TECHNICAL_ARCHITECTURE.md §4 step 4:
  // (a) Knowledge Gap concepts whose prerequisites are already Strong, first
  // (b) prerequisite gaps before their dependents
  // (c) Developing concepts
  // (d) Strong concepts last
  const sorted = items.sort((a, b) => {
    const priority = (item: typeof items[0]) => {
      if (item.status === 'GAP' && !item.prerequisiteBlocked) return 0
      if (item.status === 'GAP' && item.prerequisiteBlocked) return 1
      if (item.status === 'DEVELOPING' && !item.prerequisiteBlocked) return 2
      if (item.status === 'DEVELOPING' && item.prerequisiteBlocked) return 3
      return 4 // STRONG
    }
    const pa = priority(a)
    const pb = priority(b)
    if (pa !== pb) return pa - pb
    return a.masteryPercent - b.masteryPercent // lower mastery first within same priority group
  })

  const reasonMap: Record<string, string> = {
    '0': 'Knowledge gap — practice needed',
    '1': 'Knowledge gap (blocked by prerequisite)',
    '2': 'Developing — needs more practice',
    '3': 'Developing (blocked by prerequisite)',
    '4': 'Strong — optional review',
  }

  const path = await prisma.learningPath.create({
    data: {
      studentId,
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
