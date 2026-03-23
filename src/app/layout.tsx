import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1C2536",
};

export const metadata: Metadata = {
  title: "Defenz - Gestao Estrategica de Atividades",
  description: "Sistema completo para gerenciamento de atividades estrategicas do projeto Defenz. Desenvolvido com Next.js 16, TypeScript e tecnologias modernas.",
  keywords: ["Defenz", "Gestao de Atividades", "Next.js", "TypeScript", "Tailwind CSS", "Planejamento Estrategico", "Gerenciamento de Projetos"],
  authors: [{ name: "Defenz Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Defenz",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
  openGraph: {
    title: "Defenz - Gestao Estrategica",
    description: "Sistema completo para gerenciamento de atividades estrategicas",
    siteName: "Defenz",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Defenz - Gestao Estrategica",
    description: "Sistema completo para gerenciamento de atividades estrategicas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <ServiceWorkerRegister />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
