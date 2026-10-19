import type { Metadata } from 'next';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';

// Fuentes autoalojadas en el build: la página no consulta servicios externos al cargarse.
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex', display: 'swap' });
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', display: 'swap' });
export const metadata: Metadata = { title: 'TraceBoard — Investigación visual', description: 'Conecta evidencias, descubre hallazgos y construye requisitos trazables.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className={`${plex.variable} ${sourceSerif.variable}`}><body>{children}</body></html>;
}
