'use client'

import { useState, useTransition } from 'react'
import { updateLead, deleteLead } from '@/lib/actions/lead.actions'
import { Card, FormGroup, Input, PrimaryButton, SecondaryButton, DangerButton } from '@/components/ui'

type Lead = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  street: string | null
  houseNumber: string | null
  postalCode: string | null
  city: string | null
}

export default function LeadEditForm({ lead }: { lead: Lead }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    firstName:   lead.firstName,
    lastName:    lead.lastName,
    email:       lead.email       ?? '',
    phone:       lead.phone       ?? '',
    street:      lead.street      ?? '',
    houseNumber: lead.houseNumber ?? '',
    postalCode:  lead.postalCode  ?? '',
    city:        lead.city        ?? '',
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => updateLead(lead.id, form))
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    startTransition(() => deleteLead(lead.id))
  }

  const s = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as const

  return (
    <form onSubmit={handleSubmit}>
      <Card padding="24px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={s}>
            <FormGroup label="Voornaam" required>
              <Input value={form.firstName} onChange={set('firstName')} required />
            </FormGroup>
            <FormGroup label="Achternaam" required>
              <Input value={form.lastName} onChange={set('lastName')} required />
            </FormGroup>
          </div>
          <div style={s}>
            <FormGroup label="E-mail">
              <Input type="email" value={form.email} onChange={set('email')} />
            </FormGroup>
            <FormGroup label="Telefoon">
              <Input value={form.phone} onChange={set('phone')} />
            </FormGroup>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <FormGroup label="Straat">
              <Input value={form.street} onChange={set('street')} />
            </FormGroup>
            <FormGroup label="Huisnummer">
              <Input value={form.houseNumber} onChange={set('houseNumber')} />
            </FormGroup>
          </div>
          <div style={s}>
            <FormGroup label="Postcode">
              <Input value={form.postalCode} onChange={set('postalCode')} />
            </FormGroup>
            <FormGroup label="Stad">
              <Input value={form.city} onChange={set('city')} />
            </FormGroup>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <DangerButton type="button" onClick={handleDelete} disabled={isPending}>
          {confirmDelete ? 'Zeker weten? Klik nogmaals' : 'Verwijderen'}
        </DangerButton>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryButton href={`/leads/${lead.id}`}>Annuleren</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending || !form.firstName || !form.lastName}>
            {isPending ? 'Opslaan…' : 'Opslaan'}
          </PrimaryButton>
        </div>
      </div>
    </form>
  )
}
