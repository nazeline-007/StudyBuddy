// ============================================================
// AI Support Module
// Per TECHNICAL_ARCHITECTURE.md §7, §8
// ============================================================

import Anthropic from '@anthropic-ai/sdk'

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

// Static fallback content per concept (TECHNICAL_ARCHITECTURE.md §8)
// Used when LLM call fails or times out
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
    example: `**Example: Balanced Parentheses Checker**\n\n\`\`\`python\ndef is_balanced(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    \n    for char in s:\n        if char in '({[':      # opening bracket\n            stack.append(char)\n        elif char in ')}]':    # closing bracket\n            if not stack or stack[-1] != mapping[char]:\n                return False\n            stack.pop()\n    \n    return len(stack) == 0  # must be empty\n\n# Tests\nprint(is_balanced("({[]})"))  # True\nprint(is_balanced("([)]"))    # False\nprint(is_balanced("{["))      # False\n\`\`\``,
    practice_question: `**Practice: Next Greater Element**\n\nFor each element in an array, find the next greater element (the first element to the right that is larger). Return -1 if none exists.\n\n\`\`\`\nInput:  [4, 5, 2, 10, 8]\nOutput: [5, 10, 10, -1, -1]\n\`\`\`\n\nSolve in O(n) using a **monotonic stack**.\n\n*Hint: Use a stack to keep track of elements for which you haven't found the next greater yet.*`,
  },
  Queues: {
    explanation: `**Queues** follow the FIFO (First In, First Out) principle — like a line at a store where the first person in line is served first.\n\nCore operations:\n- **enqueue(item)** — add to rear, O(1)\n- **dequeue()** — remove from front, O(1)\n- **peek/front()** — view front without removing\n- **isEmpty()** — check if empty\n\nVariants:\n- **Simple queue**: basic FIFO\n- **Circular queue**: efficiently reuses array space\n- **Deque**: double-ended (insert/remove at both ends)\n- **Priority queue**: serve by priority, not arrival order (uses a heap)\n\nApplications:\n- BFS (Breadth-First Search)\n- Process scheduling (OS)\n- Printer queues\n- Event-driven simulation\n- Message queues (async systems)`,
    example: `**Example: Level-Order Tree Traversal Using a Queue**\n\n\`\`\`python\nfrom collections import deque\n\ndef level_order(root):\n    if not root:\n        return []\n    \n    result = []\n    queue = deque([root])\n    \n    while queue:\n        level_size = len(queue)\n        current_level = []\n        \n        for _ in range(level_size):\n            node = queue.popleft()      # dequeue\n            current_level.append(node.val)\n            if node.left:\n                queue.append(node.left)  # enqueue\n            if node.right:\n                queue.append(node.right) # enqueue\n        \n        result.append(current_level)\n    \n    return result\n\`\`\`\n\nOutput for a balanced tree: [[1], [2, 3], [4, 5, 6, 7]]`,
    practice_question: `**Practice: Sliding Window Maximum**\n\nGiven an array and a window size k, find the maximum in each sliding window.\n\n\`\`\`\nInput:  [1, 3, -1, -3, 5, 3, 6, 7], k=3\nOutput: [3, 3, 5, 5, 6, 7]\n\`\`\`\n\nSolve in O(n) using a **monotonic deque**.\n\n*Hint: Maintain a deque of indices where values are in decreasing order. Pop from front when outside window, pop from back when new value is larger.*`,
  },
  Trees: {
    explanation: `**Trees** are hierarchical data structures with a root node and child nodes forming parent-child relationships with no cycles.\n\nKey terminology:\n- **Root**: topmost node (no parent)\n- **Leaf**: node with no children\n- **Height**: longest path from root to leaf\n- **Depth**: distance from root to a node\n- **Subtree**: any node + its descendants\n- **Edge**: connection between parent and child\n\nProperties:\n- A tree with n nodes has exactly n−1 edges\n- There is exactly one path between any two nodes\n\nTypes:\n- **General tree**: any number of children\n- **Binary tree**: at most 2 children\n- **N-ary tree**: at most N children\n- **Trie**: for string prefix search\n- **Segment tree**: range queries\n- **B-tree**: database indexing`,
    example: `**Example: Finding Tree Height**\n\n\`\`\`python\nclass TreeNode:\n    def __init__(self, val):\n        self.val = val\n        self.children = []  # general tree\n\ndef height(root):\n    if root is None:\n        return -1  # empty tree has height -1\n    if not root.children:\n        return 0   # leaf node has height 0\n    \n    return 1 + max(height(child) for child in root.children)\n\n# For a binary tree:\ndef binary_height(root):\n    if root is None:\n        return -1\n    return 1 + max(binary_height(root.left), \n                   binary_height(root.right))\n\`\`\``,
    practice_question: `**Practice: Count Leaf Nodes**\n\nWrite a recursive function to count the number of leaf nodes (nodes with no children) in a general tree.\n\n\`\`\`\nTree:     1\n        / | \\\n       2  3  4\n      / \\     \\\n     5   6     7\n\nLeaf nodes: 5, 6, 3, 7 → Answer: 4\n\`\`\`\n\n*Think recursively: a leaf contributes 1; a non-leaf contributes the sum of leaf counts of its children.*`,
  },
  'Binary Trees': {
    explanation: `**Binary Trees** are trees where each node has at most 2 children: a **left** child and a **right** child.\n\nSpecial types:\n- **Full binary tree**: every node has 0 or 2 children\n- **Complete binary tree**: all levels filled except possibly the last (filled left to right)\n- **Perfect binary tree**: all internal nodes have 2 children + all leaves at same level\n- **Binary Search Tree (BST)**: left subtree values < node value < right subtree values\n- **AVL tree**: self-balancing BST (height difference ≤ 1)\n- **Red-Black tree**: self-balancing BST used in standard libraries\n\nHeight formulas:\n- Maximum nodes at height h: 2^(h+1) − 1\n- Minimum height for n nodes: ⌊log₂ n⌋`,
    example: `**Example: Binary Search Tree Insert & Search**\n\n\`\`\`python\nclass BST:\n    def __init__(self):\n        self.root = None\n    \n    def insert(self, val):\n        def _insert(node, val):\n            if node is None:\n                return TreeNode(val)\n            if val < node.val:\n                node.left = _insert(node.left, val)\n            elif val > node.val:\n                node.right = _insert(node.right, val)\n            return node\n        self.root = _insert(self.root, val)\n    \n    def search(self, val):\n        def _search(node, val):\n            if node is None or node.val == val:\n                return node\n            if val < node.val:\n                return _search(node.left, val)\n            return _search(node.right, val)\n        return _search(self.root, val) is not None\n\`\`\`\n\nSearch is O(log n) for balanced BST, O(n) worst case (skewed tree).`,
    practice_question: `**Practice: Maximum Depth of Binary Tree**\n\nFind the maximum depth (height) of a binary tree.\n\n\`\`\`\n    3\n   / \\\n  9   20\n     /  \\\n    15   7\n\nOutput: 3 (path: 3 → 20 → 15 or 3 → 20 → 7)\n\`\`\`\n\nWrite both a recursive solution and an iterative solution using a queue (BFS).\n\n*Recursive hint: height = 1 + max(height(left), height(right))*`,
  },
  'Tree Traversal': {
    explanation: `**Tree Traversal** is visiting every node in a tree exactly once. The order matters for different use cases.\n\nDepth-First Traversals (use recursion or explicit stack):\n- **Pre-order** (Root → Left → Right): copy/serialize a tree, prefix expression\n- **In-order** (Left → Root → Right): BST → sorted output\n- **Post-order** (Left → Right → Root): delete tree, postfix expression, compute directory sizes\n\nBreadth-First Traversal:\n- **Level-order** (BFS): process level by level, uses a queue\n\nComplexity: All traversals are O(n) time, O(h) space where h = height (O(n) worst case for skewed tree, O(log n) for balanced).`,
    example: `**Example: All 4 Traversals**\n\n\`\`\`\n     1\n    / \\\n   2   3\n  / \\\n 4   5\n\`\`\`\n\n\`\`\`python\ndef preorder(root):   # Root, Left, Right\n    if not root: return\n    print(root.val, end=' ')  # 1 2 4 5 3\n    preorder(root.left)\n    preorder(root.right)\n\ndef inorder(root):    # Left, Root, Right\n    if not root: return\n    inorder(root.left)\n    print(root.val, end=' ')  # 4 2 5 1 3\n    inorder(root.right)\n\ndef postorder(root):  # Left, Right, Root\n    if not root: return\n    postorder(root.left)\n    postorder(root.right)\n    print(root.val, end=' ')  # 4 5 2 3 1\n\nfrom collections import deque\ndef level_order(root): # BFS\n    q, result = deque([root]), []\n    while q:\n        node = q.popleft()\n        result.append(node.val)   # 1 2 3 4 5\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)\n\`\`\``,
    practice_question: `**Practice: Zigzag Level Order Traversal**\n\nTraverse a binary tree level by level, but alternate direction: left-to-right on even levels, right-to-left on odd levels.\n\n\`\`\`\n     3\n    / \\\n   9   20\n       / \\\n      15   7\n\nOutput: [[3], [20, 9], [15, 7]]\n\`\`\`\n\n*Hint: Use a deque and a flag to alternate between appendleft and append.*`,
  },
}

/**
 * Get fallback content for a concept and request type.
 */
function getFallbackContent(concept: string, requestType: string): string {
  const conceptFallback = FALLBACK_CONTENT[concept]
  if (!conceptFallback) {
    return `This is a key concept in Data Structures. Study it carefully and practice with examples.`
  }
  return conceptFallback[requestType] ?? conceptFallback['explanation'] ?? 'No content available.'
}

/**
 * Build the system prompt for the LLM.
 */
function buildSystemPrompt(): string {
  return `You are an expert Data Structures tutor. You provide personalized, adaptive learning content tailored to the student's specific mastery level and knowledge gaps.

RULES:
- Be precise, educational, and encouraging
- Tailor complexity to the student's mastery level
- When the student has weak areas, connect the current topic to those gaps
- For explanations: be clear and structured with examples
- For practice questions: provide a concrete problem with input/output examples
- Use markdown formatting (headers, code blocks, bullet points)
- Keep responses focused and under 400 words
- NEVER discuss topics outside Data Structures
- NEVER modify mastery scores, difficulty levels, or learning paths — that is handled by the system`
}

/**
 * Build the user prompt from context.
 */
function buildUserPrompt(ctx: AIContext): string {
  const weakAreasText = ctx.weakAreas.length > 0
    ? `The student is also weak in: ${ctx.weakAreas.join(', ')}.`
    : 'The student has no other major weak areas.'

  const masteryDesc =
    ctx.masteryPercent >= 70 ? 'strong' :
    ctx.masteryPercent >= 40 ? 'developing (needs practice)' :
    'has a significant knowledge gap'

  const requestTexts: Record<string, string> = {
    explanation: `Provide a clear, structured explanation of ${ctx.concept} appropriate for someone with ${ctx.masteryPercent.toFixed(0)}% mastery (${masteryDesc}). Their most recent score on this topic was ${ctx.recentScorePercent.toFixed(0)}%. ${weakAreasText} Focus on concepts that would help them most at this level.`,
    example: `Provide a concrete, worked example of ${ctx.concept} with code. The student has ${ctx.masteryPercent.toFixed(0)}% mastery. ${weakAreasText} Choose an example appropriate for a ${ctx.currentDifficulty} level student.`,
    practice_question: `Create a ${ctx.currentDifficulty}-difficulty practice problem for ${ctx.concept}. The student has ${ctx.masteryPercent.toFixed(0)}% mastery. ${weakAreasText} Include input/output examples and a helpful hint.`,
  }

  return requestTexts[ctx.requestType] ?? requestTexts['explanation']
}

/**
 * Main AI Support function.
 * Calls Anthropic API with student context, falls back on failure.
 * Per TECHNICAL_ARCHITECTURE.md §7: LLM may ONLY generate text content.
 */
export async function getAISupport(ctx: AIContext): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || apiKey === 'your-anthropic-api-key-here' || apiKey.trim() === '') {
    // No API key configured — return fallback immediately
    return {
      content: getFallbackContent(ctx.concept, ctx.requestType),
      isAIGenerated: false,
      error: 'AI not configured — showing curated content',
    }
  }

  try {
    const client = new Anthropic({ apiKey })

    // 10-second timeout (TECHNICAL_ARCHITECTURE.md §7)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(ctx) }],
    })

    clearTimeout(timeoutId)

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from LLM')
    }

    return { content: content.text, isAIGenerated: true }
  } catch (error: any) {
    console.error('[AI Support] LLM call failed:', error?.message ?? error)

    // Return static fallback (TECHNICAL_ARCHITECTURE.md §8)
    return {
      content: getFallbackContent(ctx.concept, ctx.requestType),
      isAIGenerated: false,
      error: error?.message ?? 'Unknown error',
    }
  }
}
