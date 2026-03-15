'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { DefenzLogoIcon } from '@/components/defenz-logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log('Login attempt started:', { email })

    try {
      console.log('Calling signIn...')

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout')), 30000)
      )

      const result = await Promise.race([
        signIn('credentials', {
          email,
          password,
          redirect: false
        }),
        timeoutPromise
      ]) as any

      console.log('SignIn result:', result)

      if (result?.error) {
        console.error('Login error:', result.error)
        toast.error('Credenciais invalidas')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        console.log('Login successful, redirecting...')
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
        router.refresh()
      } else {
        console.warn('Unexpected result:', result)
        toast.error('Erro inesperado no login')
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('Login exception:', error)
      toast.error(error.message === 'Login timeout' ? 'Tempo de login excedido. Tente novamente.' : 'Erro ao fazer login')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background gradient — white to blue like the Defenz banner */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-sky-100 to-blue-500" />

      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,_#1a56db_1px,_transparent_0)] bg-[size:32px_32px]" />

      {/* Glow orbs for depth */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-sky-300/15 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <DefenzLogoIcon size={64} />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
            DEFENZ<span className="text-blue-600">.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">
            Seguranca que simplifica
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/70 backdrop-blur-xl border-white/50 shadow-2xl shadow-blue-900/10">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold text-slate-800 text-center">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-slate-500 text-center">
              Acesse o painel de gestao estrategica
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 flex items-center gap-2 font-medium text-sm">
                  <Mail className="h-4 w-4 text-blue-500" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600 flex items-center gap-2 font-medium text-sm">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10 h-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-700 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-11 shadow-lg shadow-blue-600/25 hover:shadow-blue-700/30 transition-all duration-200 cursor-pointer"
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

              <div className="text-center pt-4 border-t border-slate-200/60">
                <p className="text-slate-500 text-sm">
                  Nao tem uma conta?{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                    Criar conta
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-xs font-medium">
            &copy; 2025 Defenz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
