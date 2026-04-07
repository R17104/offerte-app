import { redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function LegacyNewQuotePage({ params }: Props) {
  const { id } = await params
  redirect(`/quotes/new?customerId=${id}`)
}
