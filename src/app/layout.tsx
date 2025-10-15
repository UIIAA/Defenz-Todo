import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Defenz - Gestão Estratégica de Atividades",
  description: "Sistema completo para gerenciamento de atividades estratégicas do projeto Defenz. Desenvolvido com Next.js 15, TypeScript e tecnologias modernas.",
  keywords: ["Defenz", "Gestão de Atividades", "Next.js", "TypeScript", "Tailwind CSS", "Planejamento Estratégico", "Gerenciamento de Projetos"],
  authors: [{ name: "Defenz Team" }],
  openGraph: {
    title: "Defenz - Gestão Estratégica",
    description: "Sistema completo para gerenciamento de atividades estratégicas",
    siteName: "Defenz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Defenz - Gestão Estratégica",
    description: "Sistema completo para gerenciamento de atividades estratégicas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
