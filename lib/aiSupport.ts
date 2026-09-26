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
// Static fallback content per concept (TECHNICAL_ARCHITECTURE.md §8)
// Used when Gemini call fails or is not configured.
// ============================================================
const FALLBACK_CONTENT: Record<string, Record<string, string>> = {
  Arrays: {
    explanation: `**Arrays** are the most fundamental data structure — a fixed-size, contiguous block of memory where elements are accessed by index in O(1) time.\n\nKey properties:\n- **Index-based access**: arr[i] is O(1) because the address is base + i × element_size\n- **Contiguous memory**: all elements stored next to each other\n- **Fixed size** in most languages (dynamic arrays like ArrayList grow internally by copying)\n- **Cache friendly**: spatial locality means sequential reads are fast\n\nCommon operations:\n| Operation | Time Complexity |\n|---|---|\n| Access by index | O(1) |\n| Search (unsorted) | O(n) |\n| Search (sorted, binary) | O(log n) |\n| Insert at end | O(1) amortized |\n| Insert at beginning | O(n) — everything shifts |\n| Delete | O(n) — elements shift to fill gap |`,
    example: `**Example: Rotating an Array**\n\nGiven: [1, 2, 3, 4, 5], rotate right by 2 → [4, 5, 1, 2, 3]\n\n\`\`\`python\ndef rotate_right(arr, k):\n    n = len(arr)\n    k = k % n  # handle k > n\n    return arr[-k:] + arr[:-k]\n\n# Or in-place using reversal trick (O(1) extra space):\ndef rotate_inplace(arr, k):\n    n = len(arr)\n    k = k % n\n    arr.reverse()           # [5,4,3,2,1]\n    arr[:k] = arr[:k][::-1] # [4,5,3,2,1]\n    arr[k:] = arr[k:][::-1] # [4,5,1,2,3]\n\`\`\`\n\nWhy this works: reversing twice restores a subarray, which is the same as rotating.`,
    practice_question: `**Practice: Two Sum Problem**\n\nGiven an array of integers and a target sum, find two indices such that the numbers at those indices add up to the target.\n\n\`\`\`\nInput:  nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]  (because nums[0] + nums[1] = 9)\n\`\`\`\n\n**Challenge**: Solve it in O(n) time using a hash map instead of O(n²) brute force.\n\n*Hint: For each number, check if (target - number) has been seen before.*`,
  },
  'Linked Lists': {
    explanation: `**Linked Lists** are linear data structures where elements (nodes) are connected via pointers rather than stored contiguously.\n\nEach node contains:\n1. **Data** — the value stored\n2. **Pointer** — reference to the next node (and previous node in doubly linked lists)\n\nKey properties:\n- **Dynamic size**: grow/shrink without reallocation\n- **O(1) insert/delete at known position** (no shifting needed)\n- **O(n) access by index** — must traverse from head\n- **No cache locality** — poor for sequential reads\n\nTypes:\n- **Singly linked**: each node → next only\n- **Doubly linked**: each node → next AND prev\n- **Circular**: tail → head (wraps around)`,
    example: `**Example: Reversing a Linked List**\n\n1 → 2 → 3 → 4 → None  becomes  4 → 3 → 2 → 1 → None\n\n\`\`\`python\ndef reverse_linked_list(head):\n    prev = None\n    current = head\n    while current:\n        next_node = current.next  # save next\n        current.next = prev       # reverse link\n        prev = current            # advance prev\n        current = next_node       # advance current\n    return prev  # new head\n\`\`\`\n\nVisualize: We walk through the list, flipping each arrow direction. Time: O(n), Space: O(1).`,
    practice_question: `**Practice: Detect a Cycle**\n\nGiven a linked list, determine if it contains a cycle (a node that points back to an earlier node).\n\n**Constraints**: Use O(1) extra memory (no hash set allowed!).\n\n*Hint: Floyd's Cycle Detection — use two pointers: a "slow" pointer (moves 1 step at a time) and a "fast" pointer (moves 2 steps). If they meet, there's a cycle.*`,
  },
  Stacks: {
    explanation: `**Stacks** follow the LIFO (Last In, First Out) principle — like a stack of plates where you can only add or remove from the top.\n\nCore operations (all O(1)):\n- **push(item)** — add to top\n- **pop()** — remove and return top\n- **peek()** — view top without removing\n- **isEmpty()** — check if empty\n\nImplementation:\n- **Using an array**: easy, push/pop at end\n- **Using a linked list**: push/pop at head\n\nApplications:\n- Function call stack (recursion)\n- Undo/redo in editors\n- Balanced parentheses checking\n- Expression evaluation (postfix/infix)\n- DFS traversal (explicit stack)\n- Browser back navigation`,
    example: `**Example: Balanced Parentheses Checker**\n\n\`\`\`python\ndef is_balanced(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    \n    for char in s:\n        if char in '({[':\n            stack.append(char)\n        elif char in ')}]':\n            if not stack or stack[-1] != mapping[char]:\n                return False\n            stack.pop()\n    \n    return len(stack) == 0\n\nprint(is_balanced("({[]})"))  # True\nprint(is_balanced("([)]"))    # False\n\`\`\``,
    practice_question: `**Practice: Next Greater Element**\n\nFor each element in an array, find the next greater element to the right. Return -1 if none exists.\n\n\`\`\`\nInput:  [4, 5, 2, 10, 8]\nOutput: [5, 10, 10, -1, -1]\n\`\`\`\n\nSolve in O(n) using a **monotonic stack**.\n\n*Hint: Use a stack to keep track of elements for which you haven't found the next greater yet.*`,
  },
  Queues: {
    explanation: `**Queues** follow the FIFO (First In, First Out) principle — like a line at a store.\n\nCore operations:\n- **enqueue(item)** — add to rear, O(1)\n- **dequeue()** — remove from front, O(1)\n- **peek/front()** — view front without removing\n- **isEmpty()** — check if empty\n\nVariants:\n- **Simple queue**: basic FIFO\n- **Circular queue**: efficiently reuses array space\n- **Deque**: double-ended (insert/remove at both ends)\n- **Priority queue**: serve by priority (uses a heap)\n\nApplications:\n- BFS (Breadth-First Search)\n- Process scheduling (OS)\n- Printer queues\n- Message queues (async systems)`,
    example: `**Example: Level-Order Tree Traversal Using a Queue**\n\n\`\`\`python\nfrom collections import deque\n\ndef level_order(root):\n    if not root:\n        return []\n    result = []\n    queue = deque([root])\n    while queue:\n        level_size = len(queue)\n        current_level = []\n        for _ in range(level_size):\n            node = queue.popleft()\n            current_level.append(node.val)\n            if node.left: queue.append(node.left)\n            if node.right: queue.append(node.right)\n        result.append(current_level)\n    return result\n\`\`\``,
    practice_question: `**Practice: Sliding Window Maximum**\n\nGiven an array and a window size k, find the maximum in each sliding window.\n\n\`\`\`\nInput:  [1, 3, -1, -3, 5, 3, 6, 7], k=3\nOutput: [3, 3, 5, 5, 6, 7]\n\`\`\`\n\nSolve in O(n) using a **monotonic deque**.\n\n*Hint: Maintain a deque of indices where values are decreasing. Pop from front when outside window.*`,
  },
  Trees: {
    explanation: `**Trees** are hierarchical data structures with a root node and child nodes forming parent-child relationships with no cycles.\n\nKey terminology:\n- **Root**: topmost node (no parent)\n- **Leaf**: node with no children\n- **Height**: longest path from root to leaf\n- **Depth**: distance from root to a node\n- **Subtree**: any node + its descendants\n\nProperties:\n- A tree with n nodes has exactly n−1 edges\n- There is exactly one path between any two nodes\n\nTypes:\n- **General tree**: any number of children\n- **Binary tree**: at most 2 children\n- **N-ary tree**: at most N children\n- **Trie**: for string prefix search`,
    example: `**Example: Finding Tree Height**\n\n\`\`\`python\ndef height(root):\n    if root is None:\n        return -1  # empty tree\n    if not root.children:\n        return 0   # leaf node\n    return 1 + max(height(child) for child in root.children)\n\n# For a binary tree:\ndef binary_height(root):\n    if root is None:\n        return -1\n    return 1 + max(binary_height(root.left),\n                   binary_height(root.right))\n\`\`\``,
    practice_question: `**Practice: Count Leaf Nodes**\n\nWrite a recursive function to count the number of leaf nodes (nodes with no children) in a general tree.\n\n\`\`\`\nTree:     1\n        / | \\\n       2  3  4\n      / \\     \\\n     5   6     7\n\nLeaf nodes: 5, 6, 3, 7 → Answer: 4\n\`\`\`\n\n*Think recursively: a leaf contributes 1; a non-leaf contributes the sum of its children's leaf counts.*`,
  },
  'Binary Trees': {
    explanation: `**Binary Trees** are trees where each node has at most 2 children: a **left** child and a **right** child.\n\nSpecial types:\n- **Full binary tree**: every node has 0 or 2 children\n- **Complete binary tree**: all levels filled except possibly the last (filled left to right)\n- **Perfect binary tree**: all internal nodes have 2 children + all leaves at same level\n- **Binary Search Tree (BST)**: left subtree values < node value < right subtree values\n- **AVL tree**: self-balancing BST (height difference ≤ 1)\n\nHeight formulas:\n- Maximum nodes at height h: 2^(h+1) − 1\n- Minimum height for n nodes: ⌊log₂ n⌋`,
    example: `**Example: Binary Search Tree Insert & Search**\n\n\`\`\`python\ndef insert(root, val):\n    if root is None:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    elif val > root.val:\n        root.right = insert(root.right, val)\n    return root\n\ndef search(root, val):\n    if root is None or root.val == val:\n        return root is not None\n    if val < root.val:\n        return search(root.left, val)\n    return search(root.right, val)\n\`\`\`\n\nSearch is O(log n) for balanced BST, O(n) worst case (skewed tree).`,
    practice_question: `**Practice: Maximum Depth of Binary Tree**\n\nFind the maximum depth (height) of a binary tree.\n\n\`\`\`\n    3\n   / \\\n  9   20\n     /  \\\n    15   7\n\nOutput: 3\n\`\`\`\n\nWrite both a recursive solution and an iterative BFS solution.\n\n*Recursive hint: height = 1 + max(height(left), height(right))*`,
  },
  'Tree Traversal': {
    explanation: `**Tree Traversal** is visiting every node in a tree exactly once. The order matters for different use cases.\n\nDepth-First Traversals (use recursion or explicit stack):\n- **Pre-order** (Root → Left → Right): copy/serialize a tree, prefix expression\n- **In-order** (Left → Root → Right): BST → sorted output\n- **Post-order** (Left → Right → Root): delete tree, compute directory sizes\n\nBreadth-First Traversal:\n- **Level-order** (BFS): process level by level, uses a queue\n\nComplexity: All traversals are O(n) time, O(h) space where h = height.`,
    example: `**Example: All 4 Traversals**\n\n\`\`\`\n     1\n    / \\\n   2   3\n  / \\\n 4   5\n\`\`\`\n\n\`\`\`python\ndef preorder(root):   # 1 2 4 5 3\n    if not root: return\n    print(root.val, end=' ')\n    preorder(root.left)\n    preorder(root.right)\n\ndef inorder(root):    # 4 2 5 1 3\n    if not root: return\n    inorder(root.left)\n    print(root.val, end=' ')\n    inorder(root.right)\n\ndef postorder(root):  # 4 5 2 3 1\n    if not root: return\n    postorder(root.left)\n    postorder(root.right)\n    print(root.val, end=' ')\n\`\`\``,
    practice_question: `**Practice: Zigzag Level Order Traversal**\n\nTraverse a binary tree level by level, alternating direction: left-to-right on even levels, right-to-left on odd levels.\n\n\`\`\`\n     3\n    / \\\n   9   20\n       / \\\n      15   7\n\nOutput: [[3], [20, 9], [15, 7]]\n\`\`\`\n\n*Hint: Use a deque and a flag to alternate between appendleft and append.*`,
  },
}

function getFallbackContent(concept: string, requestType: string): string {
  const conceptFallback = FALLBACK_CONTENT[concept]
  if (!conceptFallback) {
    return `**${concept}** is a key concept in Data Structures. Study the core ideas carefully and practice with examples to build mastery.`
  }
  return conceptFallback[requestType] ?? conceptFallback['explanation'] ?? 'No content available.'
}

function buildSystemPrompt(): string {
  return `You are an expert Data Structures tutor. You provide personalized, adaptive learning content tailored to each student's specific mastery level and knowledge gaps.

STRICT RULES:
- Be precise, educational, and encouraging
- Tailor complexity exactly to the student's mastery level
- Connect the current topic to the student's weak areas where relevant
- For explanations: be clear and structured with bullet points and examples
- For code examples: include working, runnable code with comments
- For practice questions: provide a concrete problem with input/output examples and a hint
- Use markdown formatting (headers with ##, code blocks with triple backticks, bullet points with -)
- Keep responses focused and under 450 words
- NEVER discuss topics outside Data Structures
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
    explanation: `Provide a clear, structured explanation of **${ctx.concept}** tailored for a student with ${ctx.masteryPercent.toFixed(0)}% mastery (${masteryDesc}). Their most recent score on this topic was ${ctx.recentScorePercent.toFixed(0)}%. ${weakAreasText} Focus on the concepts they most need at this level.`,
    example: `Provide a concrete, worked code example of **${ctx.concept}**. The student has ${ctx.masteryPercent.toFixed(0)}% mastery. ${weakAreasText} Choose an example appropriate for a ${ctx.currentDifficulty}-level student. Include step-by-step explanation of the code.`,
    practice_question: `Create a ${ctx.currentDifficulty}-difficulty practice problem about **${ctx.concept}**. The student has ${ctx.masteryPercent.toFixed(0)}% mastery. ${weakAreasText} Include: problem statement, sample input/output, and a helpful hint (but not the full solution).`,
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
      content: getFallbackContent(ctx.concept, ctx.requestType),
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
        // 700 caused truncation (only ~28-100 tokens left for actual text).
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
      systemInstruction: buildSystemPrompt(),
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
      content: getFallbackContent(ctx.concept, ctx.requestType),
      isAIGenerated: false,
      error: error?.message ?? 'Gemini unavailable',
    }
  }
}
