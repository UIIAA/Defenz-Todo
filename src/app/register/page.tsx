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

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter no minimo 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao criar conta')
        setIsLoading(false)
        return
      }

      toast.success('Conta criada com sucesso! Faca login para continuar.')
      router.push('/')
    } catch (error) {
      console.error('Register error:', error)
      toast.error('Erro ao criar conta')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-sky-100 to-blue-500" />

      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,_#1a56db_1px,_transparent_0)] bg-[size:32px_32px]" />

      {/* Glow orbs */}
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-sky-300/15 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="relative p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-600/25">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
            DEFENZ<span className="text-blue-600">.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">
            Seguranca que simplifica
          </p>
        </div>

        {/* Register Card */}
        <Card className="bg-white/70 backdrop-blur-xl border-white/50 shadow-2xl shadow-blue-900/10">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold text-slate-800 text-center">
              Criar Conta
            </CardTitle>
            <CardDescription className="text-slate-500 text-center">
              Preencha os dados abaixo para criar sua conta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-600 flex items-center gap-2 font-medium text-sm">
                  <User className="h-4 w-4 text-blue-500" />
                  Nome
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all h-11"
                  required
                />
              </div>

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
                    placeholder="Minimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10 h-11"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-700 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-600 flex items-center gap-2 font-medium text-sm">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-10 h-11"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-700 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-11 shadow-lg shadow-blue-600/25 hover:shadow-blue-700/30 transition-all duration-200 mt-6 cursor-pointer"
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

              <div className="text-center pt-4 border-t border-slate-200/60">
                <p className="text-slate-500 text-sm">
                  Ja tem uma conta?{' '}
                  <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                    Fazer login
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
