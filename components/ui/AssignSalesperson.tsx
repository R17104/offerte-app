'use client'

import { useTransition } from 'react'

type User = { id: string; name: string | null; email: string }

type Props = {
  currentId: string | null
  users: User[]
  onAssign: (userId: string | null) => Promise<void>
}

export default function AssignSalesperson({ currentId, users, onAssign }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value || null
    startTransition(() => onAssign(val))
  }

  return (
    <select
      value={currentId ?? ''}
      onChange={handleChange}
      disabled={isPending}
      style={{
        width: '100%',
        padding: '7px 10px',
        borderRadius: 8,
        border: '1px solid var(--border-strong)',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        fontSize: 13.5,
        cursor: 'pointer',
        opacity: isPending ? 0.6 : 1,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <option value="">— Niet toegewezen —</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name ?? u.email}
        </option>
      ))}
    </select>
  )
}
