import type { Metadata } from 'next'
import { Geist, Geist_Mono, Syne } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['800'],
})

export const metadata: Metadata = {
  title: 'Ember — Feel every song',
  description: 'A music experience built around mood, memory, and discovery.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${syne.variable}`}>
      <body>{children}</body>
    </html>
  )
}
