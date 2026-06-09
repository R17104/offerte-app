import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const r = await prisma.product.updateMany({
    where: { notes: { contains: 'vekto.nl' } },
    data: { shopVisible: true },
  })
  console.log('shopVisible=true voor', r.count, 'producten')
}
main().finally(() => prisma.$disconnect())
