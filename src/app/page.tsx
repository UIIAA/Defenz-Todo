'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        toast.error('Credenciais inválidas')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast.error('Erro ao fazer login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Grid pattern overlay para profundidade */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo e header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative p-4 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/50 animate-pulse">
              <Shield className="h-10 w-10 text-white drop-shadow-lg" />
              {/* Efeito de brilho neon */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 opacity-50 blur-xl animate-pulse" />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 drop-shadow-lg">
            Defenz
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">Gestão Estratégica de Atividades</p>
        </div>

        {/* Card de Login */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800/50 shadow-2xl shadow-blue-900/20">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-slate-100 text-center">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Faça login para acessar o painel de atividades
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Campo de E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-blue-400" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              {/* Campo de Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-blue-400" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-100 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 shadow-lg shadow-blue-600/30 hover:shadow-blue-700/40 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 Defenz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
