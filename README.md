StudyBuddy 🎓

Adaptive AI-Powered Personalized Learning Platform

Learning isn't one-size-fits-all. Your learning path shouldn't be either.

StudyBuddy is an AI-powered personalized learning platform designed to adapt to each student's knowledge, performance, and learning needs. It identifies knowledge gaps, recommends concepts to focus on, and adjusts quiz difficulty based on student responses to create a more personalized learning experience.

Built during HackStreak 3.0, StudyBuddy explores how AI and adaptive algorithms can make digital learning more responsive to individual students.

✨ Key Features

- 📝 Diagnostic Assessment — Evaluates students' existing knowledge across Data Structures concepts.
- 📊 Knowledge Gap Detection — Tracks concept-level mastery and identifies strengths and areas for improvement.
- 🔗 Personalized Learning Paths — Recommends what to learn next based on performance, knowledge gaps, and prerequisite relationships.
- 🤖 AI-Powered Learning Support — Uses Google Gemini to generate personalized explanations, examples, and practice questions.
- 📈 Adaptive Quizzes — Adjusts question difficulty according to student answers and demonstrated understanding.
- 🔄 Continuous Learning Profile — Updates mastery and recommendations as students complete assessments and quizzes.
- 💾 Persistent Performance Tracking — Stores learner performance in PostgreSQL so recommendations can use previously recorded results.

🔄 How It Works

Diagnostic Assessment
        ↓
Knowledge Analysis
        ↓
Identify Knowledge Gaps
        ↓
Generate Personalized Learning Path
        ↓
AI-Powered Learning Support
        ↓
Adaptive Quiz
        ↓
Update Mastery & Recommendations
        ↺

StudyBuddy combines deterministic application logic with AI-generated learning support. Student performance, mastery calculations, prerequisite relationships, and learning-path decisions are handled by the application logic, while Gemini supports the generation of explanations, examples, and practice questions.

🛠️ Tech Stack

Technology| Purpose
Next.js| Full-stack application framework
React| Interactive user interface
TypeScript| Type-safe development
Tailwind CSS| Responsive UI styling
PostgreSQL| Relational database
Supabase| Hosted PostgreSQL database
Prisma ORM| Database schema and queries
Google Gemini API| AI-powered learning content

🧠 What Makes It Adaptive?

StudyBuddy goes beyond displaying quiz scores.

- Concept-level mastery: Performance is tracked for individual concepts.
- Prerequisite-aware recommendations: Foundational concepts can be prioritized before dependent concepts.
- Adaptive difficulty: Quiz difficulty responds to the student's answers.
- Personalized progression: New performance data influences subsequent learning recommendations.

The goal is to make each student's learning journey reflect their actual progress rather than follow the same fixed sequence.

📚 Learning Domain

The initial learning domain focuses on Data Structures, including:

- Arrays
- Linked Lists
- Stacks
- Queues
- Trees
- Binary Trees
- Tree Traversal

These concepts provide a focused domain for demonstrating diagnostic assessment, prerequisite-aware learning paths, and adaptive quizzes.

⚙️ Getting Started

Prerequisites

Make sure you have installed:

- Node.js and npm
- Access to a PostgreSQL database
- A Google Gemini API key for AI-powered learning support

1. Clone the repository

git clone https://github.com/nazeline-007/StudyBuddy.git
cd StudyBuddy

2. Install dependencies

npm install

3. Configure environment variables

Create a ".env" or ".env.local" file according to the environment-variable names used in the project.

Configure your PostgreSQL connection and Gemini API key. For example:

DATABASE_URL="your_postgresql_connection_string"
GEMINI_API_KEY="your_gemini_api_key"

Use the exact variable names expected by your Prisma configuration and AI integration. Never commit actual credentials or API keys.

4. Set up the database

Run the appropriate Prisma migration and seed commands defined in "package.json" and your Prisma configuration.

For example, if these scripts are configured in your project:

npx prisma migrate deploy
npx prisma db seed

For a fresh development database, follow the project's existing migration setup.

5. Start the development server

npm run dev

Open "http://localhost:3000" (http://localhost:3000) in your browser.

🔐 Security

- Keep API keys and database credentials in local environment files.
- Do not commit ".env", ".env.local", or other files containing secrets.
- Configure ".gitignore" to exclude environment files and generated build artifacts.

🎯 Project Goals

StudyBuddy was built to explore how adaptive algorithms and generative AI can work together to support personalized learning.

The project focuses on:

- Turning assessment results into meaningful learning recommendations.
- Connecting prerequisite knowledge with concept progression.
- Using AI to support individual learning needs.
- Continuously adapting the learner profile as performance changes.

👥 Team & Acknowledgements

Developed as a hackathon project for HackStreak 3.0, organized by ITSA.

Grateful to the team for collaborating on the idea, implementation, problem-solving, and presentation.

---

StudyBuddy — Learn what you need next. 🚀
