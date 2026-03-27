import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NextLead — Prospección B2B para Agencias',
  description: 'Encuentra clientes potenciales automáticamente con IA. Emails personalizados y seguimientos automáticos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#070B14] text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
