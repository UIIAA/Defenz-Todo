import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DefenzLogoIcon } from '@/components/defenz-logo'
import { TicketForm } from './ticket-form'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Abrir chamado de suporte — Defenz',
  description: 'Abra um chamado de suporte tecnico Defenz. Acesso exclusivo para clientes cadastrados.',
  robots: { index: false, follow: false },
}

export default function AbrirTicketPage() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-start py-10 px-4 overflow-hidden">
      {/* Fundo gradiente igual ao register */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-sky-100 to-blue-500" />
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,_#1a56db_1px,_transparent_0)] bg-[size:32px_32px]" />
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-sky-300/15 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header / Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <DefenzLogoIcon size={56} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
            DEFENZ<span className="text-blue-600">.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">
            Seguranca que simplifica
          </p>
        </div>

        {/* Card principal */}
        <Card className="bg-white/80 backdrop-blur-xl border-white/50 shadow-2xl shadow-blue-900/10">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <ShieldCheck className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Abrir chamado de suporte
                </CardTitle>
                <CardDescription className="text-slate-500 text-sm mt-0.5">
                  Exclusivo para clientes cadastrados na console Defenz
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <TicketForm />
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-xs font-medium">
            &copy; {new Date().getFullYear()} Defenz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
