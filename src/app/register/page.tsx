'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Shield, Lock, Mail, Eye, EyeOff, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validações
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao criar conta')
        setIsLoading(false)
        return
      }

      toast.success('Conta criada com sucesso! Faça login para continuar.')
      router.push('/')
    } catch (error) {
      console.error('Register error:', error)
      toast.error('Erro ao criar conta')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo e header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative p-4 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/50 animate-pulse">
              <Shield className="h-10 w-10 text-white drop-shadow-lg" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 opacity-50 blur-xl animate-pulse" />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 drop-shadow-lg">
            Defenz
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">Gestão Estratégica de Atividades</p>
        </div>

        {/* Card de Registro */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800/50 shadow-2xl shadow-blue-900/20">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-slate-100 text-center">
              Criar Conta
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Preencha os dados abaixo para criar sua conta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-blue-400" />
                  Nome
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              {/* E-mail */}
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

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-blue-400" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-100 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-blue-400" />
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-100 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Botão de Registro */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 shadow-lg shadow-blue-600/30 hover:shadow-blue-700/40 transition-all duration-200 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  'Criar Conta'
                )}
              </Button>

              {/* Link para Login */}
              <div className="text-center pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-sm">
                  Já tem uma conta?{' '}
                  <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Fazer login
                  </Link>
                </p>
              </div>
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
