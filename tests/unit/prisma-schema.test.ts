import { describe, it, expect } from 'vitest'

describe('Prisma client', () => {
  it('can be imported', async () => {
    const { PrismaClient } = await import('@/generated/prisma/client')
    expect(PrismaClient).toBeDefined()
  })
})
