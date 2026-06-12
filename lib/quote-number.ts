import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// Nummers worden bepaald op basis van het hoogste bestaande nummer (niet een
// count): na verwijderen van een offerte mag een nummer nooit hergebruikt worden.
export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `OFT-${year}-`

  const existing = await prisma.quote.findMany({
    where: { quoteNumber: { startsWith: prefix } },
    select: { quoteNumber: true },
  })

  const maxSeq = existing.reduce((max, q) => {
    const seq = parseInt(q.quoteNumber.slice(prefix.length), 10)
    return Number.isFinite(seq) && seq > max ? seq : max
  }, 0)

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`
}

// Voert `create` uit met een vers offertenummer; bij een botsing door een
// gelijktijdige aanvraag (P2002 op quoteNumber) wordt opnieuw geprobeerd.
export async function withQuoteNumber<T>(create: (quoteNumber: string) => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    const quoteNumber = await generateQuoteNumber()
    try {
      return await create(quoteNumber)
    } catch (e) {
      lastError = e
      const isUniqueConflict =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002' &&
        (e.meta?.target as string[] | undefined)?.includes('quoteNumber')
      if (!isUniqueConflict) throw e
    }
  }
  throw lastError
}
