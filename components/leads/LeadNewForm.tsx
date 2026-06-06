'use client'

import { useState, useTransition } from 'react'
import { createLead } from '@/lib/actions/lead.actions'
import { Card, FormGroup, Input, PrimaryButton, SecondaryButton } from '@/components/ui'

export default function LeadNewForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    street: '', houseNumber: '', postalCode: '', city: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => createLead(form))
  }

  const s = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as const

  return (
    <form onSubmit={handleSubmit}>
      <Card padding="24px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={s}>
            <FormGroup label="Voornaam" required>
              <Input value={form.firstName} onChange={set('firstName')} placeholder="Jan" required />
            </FormGroup>
            <FormGroup label="Achternaam" required>
              <Input value={form.lastName} onChange={set('lastName')} placeholder="de Vries" required />
            </FormGroup>
          </div>
          <div style={s}>
            <FormGroup label="E-mail">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="jan@email.nl" />
            </FormGroup>
            <FormGroup label="Telefoon">
              <Input value={form.phone} onChange={set('phone')} placeholder="06 12345678" />
            </FormGroup>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <FormGroup label="Straat">
              <Input value={form.street} onChange={set('street')} placeholder="Hoofdstraat" />
            </FormGroup>
            <FormGroup label="Huisnummer">
              <Input value={form.houseNumber} onChange={set('houseNumber')} placeholder="12A" />
            </FormGroup>
          </div>
          <div style={s}>
            <FormGroup label="Postcode">
              <Input value={form.postalCode} onChange={set('postalCode')} placeholder="8801 AB" />
            </FormGroup>
            <FormGroup label="Stad">
              <Input value={form.city} onChange={set('city')} placeholder="Franeker" />
            </FormGroup>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <SecondaryButton href="/leads">Annuleren</SecondaryButton>
        <PrimaryButton type="submit" disabled={isPending || !form.firstName || !form.lastName}>
          {isPending ? 'Opslaan…' : 'Lead opslaan'}
        </PrimaryButton>
      </div>
    </form>
  )
}
