// ============================================================
// AI Support Module — powered by Gemini
// Per TECHNICAL_ARCHITECTURE.md §7, §8
// LLM BOUNDARY: Gemini may ONLY generate text explanations,
// examples, and practice questions. It MUST NOT set mastery,
// decide prerequisites, score answers, or generate path order.
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIContext {
  concept: string
  subject: string           // e.g. "Data Structures", "Mathematics", "Physics", "Chemistry"
  masteryPercent: number
  weakAreas: string[]
  recentScorePercent: number
  currentDifficulty: 'Easy' | 'Medium' | 'Hard'
  requestType: 'explanation' | 'example' | 'practice_question'
}

export interface AIResponse {
  content: string
  isAIGenerated: boolean
  error?: string
}

// ============================================================
// Static fallback content — generic per-subject default used when
// Gemini is unavailable AND the concept is not in the specific map below.
// ============================================================
const SUBJECT_FALLBACK: Record<string, Record<string, string>> = {
  'Data Structures': {
    explanation: '**Data Structures** are ways of organizing and storing data in a computer so that it can be accessed and modified efficiently. Study the core ideas carefully and practice with examples to build mastery.',
    example: 'Practice implementing common data structures like arrays, linked lists, stacks, and queues in your preferred programming language.',
    practice_question: 'Implement a basic stack using an array and test push, pop, and peek operations.',
  },
  'Mathematics': {
    explanation: '**Mathematics** is the study of numbers, quantities, shapes, and patterns. Focus on understanding core principles and practice solving problems step by step.',
    example: 'Work through sample problems from your textbook, paying careful attention to each step of the solution.',
    practice_question: 'Solve a set of practice problems related to the concept you are currently studying.',
  },
  'Physics': {
    explanation: '**Physics** is the natural science that studies matter, its fundamental constituents, its motion, and its behavior. Understanding the underlying principles is key.',
    example: 'Apply the relevant formulas and principles to solve sample problems, drawing diagrams where helpful.',
    practice_question: 'Solve a numerical problem using the relevant physics formula, showing all steps.',
  },
  'Chemistry': {
    explanation: '**Chemistry** is the scientific discipline involved with elements and compounds composed of atoms, molecules, and ions. Focus on understanding reactions and properties.',
    example: 'Balance a chemical equation and analyze the types of reactions involved.',
    practice_question: 'Write and balance the chemical equation for a given reaction, then identify its type.',
  },
}

// ============================================================
// Specific fallback content for Data Structures concepts
// ============================================================
const DATA_STRUCTURES_FALLBACK: Record<string, Record<string, string>> = {
  Arrays: {
    explanation: `**Arrays** are the most fundamental data structure — a fixed-size, contiguous block of memory where elements are accessed by index in O(1) time.\n\nKey properties:\n- **Index-based access**: arr[i] is O(1) because the address is base + i × element_size\n- **Contiguous memory**: all elements stored next to each other\n- **Fixed size** in most languages (dynamic arrays like ArrayList grow internally by copying)\n- **Cache friendly**: spatial locality means sequential reads are fast\n\nCommon operations:\n| Operation | Time Complexity |\n|---|---|\n| Access by index | O(1) |\n| Search (unsorted) | O(n) |\n| Search (sorted, binary) | O(log n) |\n| Insert at end | O(1) amortized |\n| Insert at beginning | O(n) — everything shifts |\n| Delete | O(n) — elements shift to fill gap |`,
    example: `**Example: Rotating an Array**\n\nGiven: [1, 2, 3, 4, 5], rotate right by 2 → [4, 5, 1, 2, 3]\n\n\`\`\`python\ndef rotate_right(arr, k):\n    n = len(arr)\n    k = k % n  # handle k > n\n    return arr[-k:] + arr[:-k]\n\`\`\``,
    practice_question: `**Practice: Two Sum Problem**\n\nGiven an array of integers and a target sum, find two indices such that the numbers at those indices add up to the target.\n\n\`\`\`\nInput:  nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]  (because nums[0] + nums[1] = 9)\n\`\`\`\n\n**Challenge**: Solve it in O(n) time using a hash map.\n\n*Hint: For each number, check if (target - number) has been seen before.*`,
  },
  'Linked Lists': {
    explanation: `**Linked Lists** are linear data structures where elements (nodes) are connected via pointers rather than stored contiguously.\n\nEach node contains:\n1. **Data** — the value stored\n2. **Pointer** — reference to the next node\n\nKey properties:\n- **Dynamic size**: grow/shrink without reallocation\n- **O(1) insert/delete at known position**\n- **O(n) access by index** — must traverse from head`,
    example: `**Example: Reversing a Linked List**\n\n\`\`\`python\ndef reverse_linked_list(head):\n    prev = None\n    current = head\n    while current:\n        next_node = current.next\n        current.next = prev\n        prev = current\n        current = next_node\n    return prev\n\`\`\``,
    practice_question: `**Practice: Detect a Cycle**\n\nGiven a linked list, determine if it contains a cycle using O(1) extra memory.\n\n*Hint: Floyd's Cycle Detection — use slow and fast pointers.*`,
  },
  Stacks: {
    explanation: `**Stacks** follow the LIFO (Last In, First Out) principle.\n\nCore operations (all O(1)):\n- **push(item)** — add to top\n- **pop()** — remove and return top\n- **peek()** — view top without removing\n\nApplications: function call stack, undo/redo, balanced parentheses, DFS.`,
    example: `**Example: Balanced Parentheses Checker**\n\n\`\`\`python\ndef is_balanced(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in '({[': stack.append(char)\n        elif char in ')}]':\n            if not stack or stack[-1] != mapping[char]: return False\n            stack.pop()\n    return len(stack) == 0\n\`\`\``,
    practice_question: `**Practice: Next Greater Element**\n\nFor each element in an array, find the next greater element to the right. Return -1 if none exists. Solve in O(n) using a monotonic stack.`,
  },
  Queues: {
    explanation: `**Queues** follow the FIFO (First In, First Out) principle.\n\nCore operations:\n- **enqueue(item)** — add to rear, O(1)\n- **dequeue()** — remove from front, O(1)\n\nApplications: BFS, process scheduling, message queues.`,
    example: `**Example: Level-Order Tree Traversal Using a Queue**\n\n\`\`\`python\nfrom collections import deque\ndef level_order(root):\n    if not root: return []\n    queue = deque([root])\n    result = []\n    while queue:\n        node = queue.popleft()\n        result.append(node.val)\n        if node.left: queue.append(node.left)\n        if node.right: queue.append(node.right)\n    return result\n\`\`\``,
    practice_question: `**Practice: Sliding Window Maximum**\n\nGiven an array and window size k, find the maximum in each sliding window. Solve in O(n) using a monotonic deque.`,
  },
  Trees: {
    explanation: `**Trees** are hierarchical data structures with a root node and child nodes forming parent-child relationships with no cycles.\n\nKey terminology: Root, Leaf, Height, Depth, Subtree.\n\nProperties: A tree with n nodes has exactly n−1 edges.`,
    example: `**Example: Finding Tree Height**\n\n\`\`\`python\ndef height(root):\n    if root is None: return -1\n    return 1 + max(height(root.left), height(root.right))\n\`\`\``,
    practice_question: `**Practice: Count Leaf Nodes**\n\nWrite a recursive function to count the number of leaf nodes in a binary tree.`,
  },
  'Binary Trees': {
    explanation: `**Binary Trees** are trees where each node has at most 2 children: left and right.\n\nSpecial types: Full, Complete, Perfect, BST, AVL.`,
    example: `**Example: BST Insert & Search**\n\n\`\`\`python\ndef insert(root, val):\n    if root is None: return TreeNode(val)\n    if val < root.val: root.left = insert(root.left, val)\n    else: root.right = insert(root.right, val)\n    return root\n\`\`\``,
    practice_question: `**Practice: Maximum Depth of Binary Tree**\n\nFind the maximum depth of a binary tree. Write both recursive and iterative BFS solutions.`,
  },
  'Tree Traversal': {
    explanation: `**Tree Traversal** visits every node exactly once.\n\n- **Pre-order** (Root→Left→Right)\n- **In-order** (Left→Root→Right): BST gives sorted output\n- **Post-order** (Left→Right→Root)\n- **Level-order** (BFS): uses a queue\n\nAll traversals: O(n) time, O(h) space.`,
    example: `**Example: All 4 Traversals**\n\n\`\`\`python\ndef inorder(root):  # gives sorted output for BST\n    if not root: return\n    inorder(root.left)\n    print(root.val)\n    inorder(root.right)\n\`\`\``,
    practice_question: `**Practice: Zigzag Level Order Traversal**\n\nTraverse a binary tree level by level, alternating direction (L→R then R→L). Return list of levels.\n\n*Hint: Use a deque and a flag to alternate appendleft/append.*`,
  },
}

function getFallbackContent(concept: string, subject: string, requestType: string): string {
  // Try concept-specific fallback first (Data Structures has rich per-concept content)
  if (DATA_STRUCTURES_FALLBACK[concept]) {
    return DATA_STRUCTURES_FALLBACK[concept][requestType]
      ?? DATA_STRUCTURES_FALLBACK[concept]['explanation']
      ?? ''
  }

  // Generic subject-level fallback
  const subjectFallback = SUBJECT_FALLBACK[subject] ?? SUBJECT_FALLBACK['Data Structures']
  const base = subjectFallback[requestType] ?? subjectFallback['explanation'] ?? ''

  return `**${concept}** — ${subject}\n\n${base}`
}

function buildSystemPrompt(subject: string): string {
  return `You are an expert ${subject} tutor. You provide personalized, adaptive learning content tailored to each student's specific mastery level and knowledge gaps.

STRICT RULES:
- Be precise, educational, and encouraging
- Tailor complexity exactly to the student's mastery level
- Connect the current topic to the student's weak areas where relevant
- For explanations: be clear and structured with bullet points and examples
- For code examples (if applicable): include working code with comments
- For practice questions: provide a concrete problem with input/output examples and a helpful hint (but not the full solution)
- Use markdown formatting (headers with ##, code blocks with triple backticks, bullet points with -)
- Keep responses focused and under 500 words
- ONLY discuss topics within ${subject}
- NEVER set, modify, or suggest changes to mastery scores, difficulty levels, or learning path order — those are computed by the system, not you`
}

function buildUserPrompt(ctx: AIContext): string {
  const weakAreasText = ctx.weakAreas.length > 0
    ? `The student is also weak in: ${ctx.weakAreas.slice(0, 4).join(', ')}.`
    : 'The student has no other major weak areas.'

  const masteryDesc =
    ctx.masteryPercent >= 70 ? 'strong grasp' :
    ctx.masteryPercent >= 40 ? 'developing understanding (needs practice)' :
    'significant knowledge gap (needs foundations)'

  const requestTexts: Record<string, string> = {
    explanation: `Provide a clear, structured explanation of **${ctx.concept}** (in the context of ${ctx.subject}) tailored for a student with ${ctx.masteryPercent.toFixed(0)}% mastery (${masteryDesc}). Their most recent score was ${ctx.recentScorePercent.toFixed(0)}%. ${weakAreasText} Focus on the concepts they most need at this level.`,
    example: `Provide a concrete, worked example of **${ctx.concept}** in ${ctx.subject}. The student has ${ctx.masteryPercent.toFixed(0)}% mastery. ${weakAreasText} Choose an example appropriate for a ${ctx.currentDifficulty}-level student. Explain each step clearly.`,
    practice_question: `Create a ${ctx.currentDifficulty}-difficulty practice problem about **${ctx.concept}** in ${ctx.subject}. The student has ${ctx.masteryPercent.toFixed(0)}% mastery. ${weakAreasText} Include: problem statement, sample input/output (if applicable), and a helpful hint (but not the full solution).`,
  }

  return requestTexts[ctx.requestType] ?? requestTexts['explanation']
}

/**
 * Main AI Support function — uses Gemini 2.5 Flash.
 * Falls back to static content on any failure.
 * Per TECHNICAL_ARCHITECTURE.md §7: LLM may ONLY generate text explanations.
 */
export async function getAISupport(ctx: AIContext): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY

  // No key or placeholder → immediate fallback
  if (!apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.trim() === '') {
    return {
      content: getFallbackContent(ctx.concept, ctx.subject, ctx.requestType),
      isAIGenerated: false,
      error: 'AI not configured — showing curated content',
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        // gemini-2.5-flash is a thinking model: it uses ~600-800 tokens for
        // internal reasoning before generating the visible response.
        // maxOutputTokens must be large enough for thinking + response.
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
      systemInstruction: buildSystemPrompt(ctx.subject),
    })

    // 30-second timeout — gemini-2.5-flash thinking model takes 5-15s
    const timeoutMs = 30000
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timed out after 30s')), timeoutMs)
    )

    const prompt = buildUserPrompt(ctx)
    const resultPromise = model.generateContent(prompt)

    const result = await Promise.race([resultPromise, timeoutPromise])
    const text = result.response.text()

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from Gemini')
    }

    return { content: text, isAIGenerated: true }
  } catch (error: any) {
    console.error('[AI Support] Gemini call failed:', error?.message ?? error)

    // Static fallback — app keeps working without Gemini
    return {
      content: getFallbackContent(ctx.concept, ctx.subject, ctx.requestType),
      isAIGenerated: false,
      error: error?.message ?? 'Gemini unavailable',
    }
  }
}
