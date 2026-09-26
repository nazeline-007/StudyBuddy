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

// Specific fallback content by concept across all subjects
const CONCEPT_FALLBACKS: Record<string, Record<string, string>> = {
  // Data Structures
  Arrays: {
    explanation: `**Arrays** are the most fundamental data structure — a fixed-size, contiguous block of memory where elements are accessed by index in O(1) time.\n\nKey properties:\n- **Index-based access**: arr[i] is O(1) because the address is base + i × element_size\n- **Contiguous memory**: all elements stored next to each other\n- **Fixed size** in most languages\n- **Cache friendly**: spatial locality means sequential reads are fast`,
    example: `**Example: Rotating an Array**\n\n\`\`\`python\ndef rotate_right(arr, k):\n    n = len(arr)\n    k = k % n\n    return arr[-k:] + arr[:-k]\n\`\`\``,
    practice_question: `**Practice: Two Sum Problem**\n\nGiven an array of integers and a target sum, find two indices such that numbers add to target in O(n) time using a hash map.`,
  },
  'Linked Lists': {
    explanation: `**Linked Lists** are linear data structures where elements (nodes) are connected via pointers rather than stored contiguously.\n\nEach node contains data and a pointer to the next node. Insertion and deletion at known positions are O(1), while index-based search is O(n).`,
    example: `**Example: Reversing a Singly Linked List**\n\n\`\`\`python\ndef reverse_list(head):\n    prev, curr = None, head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev\n\`\`\``,
    practice_question: `**Practice: Detect a Cycle**\n\nImplement Floyd's Cycle Detection (slow and fast pointers) to determine if a linked list contains a cycle.`,
  },
  Stacks: {
    explanation: `**Stacks** follow the LIFO (Last In, First Out) principle with O(1) push, pop, and peek operations. Essential for call stacks, undo/redo, syntax parsing, and DFS.`,
    example: `**Example: Matching Parentheses**\n\n\`\`\`python\ndef is_valid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping.values(): stack.append(char)\n        elif char in mapping:\n            if not stack or stack.pop() != mapping[char]: return False\n    return len(stack) == 0\n\`\`\``,
    practice_question: `**Practice: Next Greater Element**\n\nGiven an array, find the next greater element for each item using a monotonic stack.`,
  },
  Queues: {
    explanation: `**Queues** follow the FIFO (First In, First Out) principle with O(1) enqueue and dequeue operations. Essential for BFS, print queues, and task scheduling.`,
    example: `**Example: BFS Level Order Traversal**\n\n\`\`\`python\nfrom collections import deque\ndef bfs(root):\n    if not root: return []\n    q, res = deque([root]), []\n    while q:\n        node = q.popleft()\n        res.append(node.val)\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)\n    return res\n\`\`\``,
    practice_question: `**Practice: Implement a Queue using Stacks**\n\nImplement a FIFO queue using two LIFO stacks with amortized O(1) operations.`,
  },
  Trees: {
    explanation: `**Trees** are hierarchical nonlinear data structures consisting of nodes connected by edges without any cycles. A tree with n nodes has exactly n−1 edges.`,
    example: `**Example: Calculate Tree Height**\n\n\`\`\`python\ndef tree_height(root):\n    if not root: return 0\n    return 1 + max(tree_height(root.left), tree_height(root.right))\n\`\`\``,
    practice_question: `**Practice: Count Leaf Nodes**\n\nWrite a recursive function to count all leaf nodes (nodes with 0 children) in a tree.`,
  },
  'Binary Trees': {
    explanation: `**Binary Trees** constrain each node to at most two children (left and right). Binary Search Trees (BST) maintain the invariant that left < node < right for O(log n) average search.`,
    example: `**Example: BST Insertion**\n\n\`\`\`python\ndef bst_insert(root, val):\n    if not root: return TreeNode(val)\n    if val < root.val: root.left = bst_insert(root.left, val)\n    else: root.right = bst_insert(root.right, val)\n    return root\n\`\`\``,
    practice_question: `**Practice: Validate BST**\n\nWrite a function to verify whether a given binary tree satisfies the BST property for all nodes.`,
  },
  'Tree Traversal': {
    explanation: `**Tree Traversal** systematically visits all nodes:\n- **Pre-order**: Root → Left → Right\n- **In-order**: Left → Root → Right (yields sorted sequence in BST)\n- **Post-order**: Left → Right → Root\n- **Level-order**: Breadth-first using a queue`,
    example: `**Example: In-order Traversal**\n\n\`\`\`python\ndef inorder(root):\n    return inorder(root.left) + [root.val] + inorder(root.right) if root else []\n\`\`\``,
    practice_question: `**Practice: Zigzag Traversal**\n\nTraverse binary tree levels alternating left-to-right and right-to-left.`,
  },

  // Mathematics
  'Linear Equations': {
    explanation: `**Linear Equations** are algebraic equations of degree 1 (e.g., y = mx + b). In 2D, they represent straight lines characterized by their slope (rate of change) and y-intercept.`,
    example: `**Example: Solving a System of 2 Equations**\n\nGiven: 2x + y = 7 and x - y = 2\nAdd both equations: 3x = 9 → x = 3\nSubstitute: 3 - y = 2 → y = 1\nSolution: (3, 1)`,
    practice_question: `**Practice: Find Line Equation**\n\nFind the equation of the line passing through (2, 5) and (4, 11) in slope-intercept form.`,
  },
  'Quadratic Equations': {
    explanation: `**Quadratic Equations** take the standard form ax² + bx + c = 0 (a ≠ 0). The roots are given by x = (-b ± √(b² - 4ac)) / (2a). The discriminant Δ = b² - 4ac determines whether roots are real distinct (Δ > 0), real equal (Δ = 0), or complex conjugates (Δ < 0).`,
    example: `**Example: Factoring Quadratics**\n\nSolve: x² - 7x + 12 = 0\nFind factors of 12 that sum to -7: -3 and -4\n(x - 3)(x - 4) = 0 → x = 3 or x = 4`,
    practice_question: `**Practice: Quadratic Vertex**\n\nFind the coordinates of the vertex of the parabola y = 2x² - 8x + 5.`,
  },
  'Functions & Graphs': {
    explanation: `A **Function** f: X → Y assigns exactly one output in Y to each input in X. Tested graphically by the Vertical Line Test. Key features include domain, range, intercepts, and transformations.`,
    example: `**Example: Composite Functions**\n\nIf f(x) = 2x + 1 and g(x) = x², then (f ∘ g)(3) = f(g(3)) = f(9) = 2(9) + 1 = 19.`,
    practice_question: `**Practice: Finding Inverse Functions**\n\nFind the formula for the inverse function f⁻¹(x) given f(x) = (3x - 4) / 5.`,
  },
  'Limits & Continuity': {
    explanation: `The **Limit** of f(x) as x approaches c is L if f(x) gets arbitrarily close to L as x nears c. A function is continuous at c if lim(x→c) f(x) = f(c).`,
    example: `**Example: Factorization Technique for Limits**\n\nlim(x→2) (x² - 4)/(x - 2) = lim(x→2) ((x-2)(x+2))/(x-2) = lim(x→2) (x+2) = 4.`,
    practice_question: `**Practice: Limit with Conjugate**\n\nEvaluate lim(x→0) (√(x + 4) - 2) / x by rationalizing the numerator.`,
  },
  'Derivatives & Differentiation': {
    explanation: `The **Derivative** f'(x) represents the instantaneous rate of change of f at x, geometrically the slope of the tangent line. Key rules include power rule, product rule, quotient rule, and chain rule.`,
    example: `**Example: Chain Rule**\n\nTo differentiate y = (3x² + 1)⁴:\nLet u = 3x² + 1, y = u⁴\ndy/dx = (dy/du) · (du/dx) = 4u³ · (6x) = 24x(3x² + 1)³.`,
    practice_question: `**Practice: Product Rule Derivative**\n\nFind the derivative of f(x) = x² · sin(x) with respect to x.`,
  },
  'Definite & Indefinite Integrals': {
    explanation: `**Integration** is the reverse process of differentiation (anti-derivative) and measures accumulated quantities such as area under a curve. The Fundamental Theorem of Calculus links derivatives and definite integrals: ∫[a to b] f(x)dx = F(b) - F(a).`,
    example: `**Example: Integration by Substitution**\n\nEvaluate ∫ 2x · e^(x²) dx:\nLet u = x², du = 2x dx\n∫ e^u du = e^u + C = e^(x²) + C.`,
    practice_question: `**Practice: Definite Area Integral**\n\nCalculate the definite integral ∫[0 to 3] (3x² + 2x) dx.`,
  },

  // Physics
  'Kinematics & Motion': {
    explanation: `**Kinematics** describes the motion of objects without reference to forces. It connects displacement (s), initial velocity (u), final velocity (v), acceleration (a), and time (t) through the constant acceleration equations.`,
    example: `**Example: Free Fall Distance**\n\nDropping a ball from rest (u=0, a=9.8 m/s²) for t=3 s:\ns = ut + ½at² = 0 + ½(9.8)(3²) = 44.1 meters.`,
    practice_question: `**Practice: Stopping Distance**\n\nA vehicle traveling at 20 m/s brakes with deceleration a = -4 m/s². What is its stopping distance?`,
  },
  "Newton's Laws of Motion": {
    explanation: `**Newton's Laws** govern classical dynamics:\n1. Law of Inertia: velocity remains constant unless a net external force acts.\n2. F_net = m · a: acceleration is proportional to net force.\n3. Action-Reaction: forces always occur in equal and opposite pairs.`,
    example: `**Example: Inclined Plane**\n\nFor a mass m on a frictionless plane inclined at angle θ, the component of gravity down the incline is F = m · g · sin(θ), giving acceleration a = g · sin(θ).`,
    practice_question: `**Practice: Cable Tension**\n\nAn elevator of mass 800 kg accelerates upward at 2.5 m/s². Calculate the tension in the cable (g = 9.8 m/s²).`,
  },
  'Work, Energy & Power': {
    explanation: `**Work** W = F · d · cos(θ) measures energy transferred by a force. Kinetic energy is KE = ½mv², gravitational potential energy is PE = mgh. Total mechanical energy is conserved in isolated systems with conservative forces. Power is the rate of doing work: P = W/t.`,
    example: `**Example: Conservation of Energy**\n\nDropping mass m from height h:\nInitial PE = mgh, KE = 0\nFinal PE = 0, KE = ½mv²\nSetting mgh = ½mv² → v = √(2gh).`,
    practice_question: `**Practice: Spring Energy**\n\nA spring with constant k = 200 N/m is compressed by 0.1 m. How much elastic potential energy is stored?`,
  },
  'Linear Momentum & Collisions': {
    explanation: `**Linear Momentum** p = m · v is conserved in isolated systems. In elastic collisions, both momentum and kinetic energy are conserved. In inelastic collisions, kinetic energy is converted to thermal/deformation energy while total momentum remains conserved.`,
    example: `**Example: Inelastic Collision**\n\nA 1000 kg car at 20 m/s collides and locks together with a stationary 1000 kg car.\nTotal mass = 2000 kg\nConservation of momentum: (1000)(20) = (2000)(v_final) → v_final = 10 m/s.`,
    practice_question: `**Practice: Impulse Calculation**\n\nA 0.5 kg ball traveling at 15 m/s hits a wall and rebounds at 10 m/s. Find the magnitude of the impulse delivered to the ball.`,
  },
  'Laws of Thermodynamics': {
    explanation: `**Thermodynamics** governs thermal energy transfer:\n- 0th Law: defines temperature & thermal equilibrium.\n- 1st Law: ΔU = Q - W (conservation of energy).\n- 2nd Law: entropy of an isolated system never decreases.\n- 3rd Law: entropy approaches a constant minimum at 0 K.`,
    example: `**Example: Carnot Engine Efficiency**\n\nAn engine operating between T_hot = 600 K and T_cold = 300 K has maximum theoretical efficiency:\nη = 1 - (T_cold / T_hot) = 1 - (300/600) = 50%.`,
    practice_question: `**Practice: Ideal Gas Work**\n\nAn ideal gas expands isothermally at 300 K from 1 L to 2 L against external pressure. Explain how internal energy changes during this process.`,
  },
  'Wave Motion & Sound': {
    explanation: `**Waves** transfer energy without transporting matter. Wave speed v = f · λ. Sound waves are longitudinal mechanical pressure waves. Phenomena include superposition, interference, resonance, diffraction, and the Doppler effect.`,
    example: `**Example: Sound Wavelength**\n\nFor a sound wave at frequency f = 440 Hz (concert A) in air (v = 340 m/s):\nλ = v / f = 340 / 440 ≈ 0.77 meters.`,
    practice_question: `**Practice: Doppler Frequency Shift**\n\nA siren emits a 500 Hz tone while moving toward a stationary listener at 30 m/s. Calculate the perceived frequency (speed of sound = 340 m/s).`,
  },

  // Chemistry
  'Atomic Structure & Isotopes': {
    explanation: `**Atoms** consist of a dense positive nucleus (protons + neutrons) surrounded by electrons in quantum orbitals. The atomic number Z equals the number of protons. Isotopes share Z but differ in neutron count A - Z.`,
    example: `**Example: Electron Configuration**\n\nSodium (Z = 11): 1s² 2s² 2p⁶ 3s¹\nIt has 1 valence electron in the 3s orbital, making it readily lose 1 electron to form Na⁺.`,
    practice_question: `**Practice: Isotope Average Mass**\n\nChlorine is 75% Cl-35 (mass 35 amu) and 25% Cl-37 (mass 37 amu). Calculate the average atomic mass.`,
  },
  'Periodic Trends & Elements': {
    explanation: `**Periodic Trends** arise from nuclear charge and electron shielding:\n- **Atomic Radius**: decreases left-to-right, increases top-to-bottom.\n- **Electronegativity & Ionization Energy**: increase left-to-right, decrease top-to-bottom.\n- **Metallic Character**: increases right-to-left and top-to-bottom.`,
    example: `**Example: Comparing Ionization Energies**\n\nFluorine has a smaller radius and higher effective nuclear charge than Carbon, meaning its valence electrons are held much more tightly → higher ionization energy.`,
    practice_question: `**Practice: Radius Comparison**\n\nArrange K, Na, and Mg in order of increasing atomic radius with explanation.`,
  },
  'Chemical Bonding & Molecular Structure': {
    explanation: `**Chemical Bonds** form when atoms attain lower energy (octet rule):\n- **Ionic**: electron transfer between metal and nonmetal.\n- **Covalent**: electron sharing between nonmetals (polar or nonpolar).\n- **VSEPR Theory**: predicts 3D shapes (linear, trigonal planar, tetrahedral, bent).`,
    example: `**Example: Water Molecule Geometry**\n\nIn H₂O, Oxygen has 2 bonding pairs and 2 lone pairs (steric number 4). The electron geometry is tetrahedral, resulting in a bent molecular geometry with bond angle ~104.5°.`,
    practice_question: `**Practice: Lewis Structure & Polarity**\n\nDraw the Lewis structure for Ammonia (NH₃) and determine if the molecule is polar or nonpolar.`,
  },
  'Chemical Formulas & Stoichiometry': {
    explanation: `**Stoichiometry** relates quantities of reactants and products based on balanced equations and the mole concept (1 mole = 6.022 × 10²³ particles). Molar mass (g/mol) converts between grams and moles.`,
    example: `**Example: Mole Conversion**\n\nHow many moles in 36 grams of H₂O (molar mass = 18 g/mol)?\nMoles = 36 g / 18 g/mol = 2.0 moles.`,
    practice_question: `**Practice: Limiting Reactant**\n\nIf 4 moles of H₂ react with 3 moles of O₂ according to 2H₂ + O₂ → 2H₂O, determine the limiting reactant and moles of H₂O produced.`,
  },
  'Types of Chemical Reactions': {
    explanation: `**Chemical Reactions** rearrange atoms into new substances:\n- **Synthesis**: A + B → AB\n- **Decomposition**: AB → A + B\n- **Single Replacement**: A + BC → AC + B\n- **Double Replacement / Neutralization**: AB + CD → AD + CB\n- **Redox**: electron transfer (Oxidation Is Loss, Reduction Is Gain).`,
    example: `**Example: Redox Identification**\n\nIn 2Na + Cl₂ → 2NaCl:\nNa is oxidized (0 to +1)\nCl is reduced (0 to -1).`,
    practice_question: `**Practice: Equation Balancing**\n\nBalance the combustion reaction of propane: _C₃H₈ + _O₂ → _CO₂ + _H₂O.`,
  },
  'Acids, Bases & pH': {
    explanation: `**Acids & Bases**:\n- **Arrhenius**: acids produce H⁺ in water; bases produce OH⁻.\n- **Brønsted-Lowry**: acids are proton donors; bases are proton acceptors.\n- **pH Scale**: pH = -log₁₀[H⁺]. Pure water at 25°C has pH = 7. Acidic < 7, Basic > 7.\n- **Buffers**: solutions of weak acid + conjugate base that resist pH changes.`,
    example: `**Example: pH Calculation**\n\nFor a 0.01 M HCl solution (strong acid, [H⁺] = 10⁻² M):\npH = -log₁₀(10⁻²) = 2.`,
    practice_question: `**Practice: Conjugate Pairs**\n\nIdentify the Brønsted-Lowry acid-base conjugate pairs in the reaction: CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺.`,
  },
}

function getFallbackContent(concept: string, subject: string, requestType: string): string {
  if (CONCEPT_FALLBACKS[concept]) {
    return CONCEPT_FALLBACKS[concept][requestType]
      ?? CONCEPT_FALLBACKS[concept]['explanation']
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
 * Main AI Support function — uses  Flash.
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
      model: 'gemini-3.8-flash',
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
