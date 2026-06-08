'use server'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function updateProfile(name: string) {
  const { userId } = await verifySession()
  await prisma.user.update({ where: { id: userId }, data: { name: name.trim() || null } })
  revalidatePath('/account')
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const { userId } = await verifySession()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.password) throw new Error('Geen wachtwoord ingesteld')
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw new Error('Huidig wachtwoord is onjuist')
  if (newPassword.length < 8) throw new Error('Nieuw wachtwoord moet minimaal 8 tekens zijn')
  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
}

export async function adminCreateUser(email: string, name: string, password: string, role: 'ADMIN' | 'SALES') {
  const { role: callerRole } = await verifySession()
  if (callerRole !== 'ADMIN') throw new Error('Geen toegang')
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('E-mailadres al in gebruik')
  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { email, name: name || null, password: hashed, role } })
  revalidatePath('/instellingen')
}

export async function adminDeleteUser(userId: string) {
  const { role, userId: callerId } = await verifySession()
  if (role !== 'ADMIN') throw new Error('Geen toegang')
  if (userId === callerId) throw new Error('Je kunt jezelf niet verwijderen')
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/instellingen')
}

export async function updateRegistrationCode(code: string) {
  const { role } = await verifySession()
  if (role !== 'ADMIN') throw new Error('Geen toegang')
  if (!/^\d{4}$/.test(code)) throw new Error('Code moet precies 4 cijfers zijn')
  await prisma.setting.upsert({
    where: { key: 'registration_code' },
    update: { value: code },
    create: { key: 'registration_code', value: code },
  })
  revalidatePath('/instellingen')
}

export async function adminUpdateRole(userId: string, newRole: 'ADMIN' | 'SALES') {
  const { role, userId: callerId } = await verifySession()
  if (role !== 'ADMIN') throw new Error('Geen toegang')
  if (userId === callerId) throw new Error('Je kunt je eigen rol niet wijzigen')
  await prisma.user.update({ where: { id: userId }, data: { role: newRole } })
  revalidatePath('/instellingen')
  redirect('/instellingen')
}
