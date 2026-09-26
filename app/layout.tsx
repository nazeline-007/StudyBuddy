import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyBuddy — Adaptive Learning for Data Structures',
  description: 'AI-powered adaptive learning platform that personalizes your Data Structures education based on your knowledge gaps and mastery levels.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
