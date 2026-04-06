import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ServiceSphere | Premium Services',
  description: 'Connect with nearby skilled workers securely and efficiently.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-bg-primary text-text-primary selection:bg-accent-primary/30">
        {children}
      </body>
    </html>
  )
}
