'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createSession, deleteSession } from '@/lib/session'

export type AuthState = { error?: string } | undefined

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email en wachtwoord zijn verplicht' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.password) {
    return { error: 'Ongeldig e-mailadres of wachtwoord' }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return { error: 'Ongeldig e-mailadres of wachtwoord' }
  }

  await createSession(user.id, user.email)
  redirect('/customers')
}

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string

  if (!email || !password) {
    return { error: 'E-mail en wachtwoord zijn verplicht' }
  }
  if (password.length < 8) {
    return { error: 'Wachtwoord moet minimaal 8 tekens zijn' }
  }
  if (password !== passwordConfirm) {
    return { error: 'Wachtwoorden komen niet overeen' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Dit e-mailadres is al in gebruik' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name: name || null },
  })

  await createSession(user.id, user.email)
  redirect('/customers')
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
