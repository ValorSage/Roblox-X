import { Inter, JetBrains_Mono } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Roblox Studio Explorer',
  description: 'A file explorer UI inspired by Roblox Studio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="bg-[#1e1e1e] text-gray-200 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
