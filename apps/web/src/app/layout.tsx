import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'TraceBoard — Investigación visual', description: 'Conecta evidencias, descubre hallazgos y construye requisitos trazables.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
