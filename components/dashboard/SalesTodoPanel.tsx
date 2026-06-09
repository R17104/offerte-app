'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addTodo, toggleTodo, deleteTodo } from '@/lib/actions/todo.actions'

type Todo = {
  id: string
  content: string
  done: boolean
  assignedTo: { id: string; name: string | null; email: string } | null
}

type User = { id: string; name: string | null; email: string }

export default function SalesTodoPanel({ todos, users }: { todos: Todo[]; users: User[] }) {
  const [text, setText] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function displayName(u: User) {
    return u.name ?? u.email.split('@')[0]
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const val = text
    const assignee = assignedTo || undefined
    setText('')
    startTransition(async () => {
      await addTodo(val, assignee)
      router.refresh()
    })
    inputRef.current?.focus()
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleTodo(id)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTodo(id)
      router.refresh()
    })
  }

  const open = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nieuwe taak toevoegen..."
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13.5,
            border: '1px solid var(--border)', background: 'var(--bg-elevated)',
            color: 'var(--text-primary)', outline: 'none',
          }}
        />
        {users.length > 1 && (
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={{
              padding: '8px 10px', borderRadius: 8, fontSize: 12.5,
              border: '1px solid var(--border)', background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <option value="">Iedereen</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{displayName(u)}</option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={pending || !text.trim()}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            opacity: pending || !text.trim() ? 0.5 : 1,
          }}
        >
          +
        </button>
      </form>

      {/* Open todos */}
      {open.length === 0 && done.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '4px 0' }}>Geen taken.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {open.map((t) => (
          <TodoRow key={t.id} todo={t} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>

      {/* Done todos */}
      {done.length > 0 && (
        <>
          <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '14px 0 6px' }}>
            Afgerond ({done.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {done.map((t) => (
              <TodoRow key={t.id} todo={t} onToggle={handleToggle} onDelete={handleDelete} done />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TodoRow({
  todo, onToggle, onDelete, done = false,
}: {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  done?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 8, background: done ? 'transparent' : 'var(--bg-elevated)',
      border: done ? 'none' : '1px solid var(--border)',
      opacity: done ? 0.55 : 1,
    }}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }}
      />
      <span style={{
        flex: 1, fontSize: 13.5, color: 'var(--text-primary)',
        textDecoration: done ? 'line-through' : 'none',
      }}>
        {todo.content}
      </span>
      {todo.assignedTo && (
        <span style={{
          fontSize: 11.5, padding: '2px 7px', borderRadius: 10,
          background: 'var(--accent-muted)', color: 'var(--accent)', fontWeight: 600, flexShrink: 0,
        }}>
          {todo.assignedTo.name ?? todo.assignedTo.email.split('@')[0]}
        </span>
      )}
      <button
        onClick={() => onDelete(todo.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
          fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1, flexShrink: 0,
        }}
        title="Verwijder"
      >
        ×
      </button>
    </div>
  )
}
