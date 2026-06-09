import AdviesPage from '@/components/marketing/AdviesPage'

type Props = { searchParams: Promise<{ product?: string }> }

export default async function GratisAdviesRoute({ searchParams }: Props) {
  const { product } = await searchParams
  return <AdviesPage product={product} />
}
