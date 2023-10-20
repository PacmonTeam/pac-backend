import { PrismaClient } from '@prisma/client'

import { DATABASE_URL } from '@/env'

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
})

export const getPrisma = () => {
  return prisma
}
