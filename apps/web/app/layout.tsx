import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Emotional Climate Dashboard',
  description: 'Monitor the emotional climate of your communities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🌡️</span>
                  <h1 className="text-xl font-bold text-gray-900">
                    Emotional Climate Dashboard
                  </h1>
                </div>
                <a
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Communities
                </a>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
