import { describe, it, expect } from 'vitest'
import { detectUrlType } from '@/lib/parsers/detect-url'

describe('detectUrlType', () => {
  it('detects Instagram post URLs', () => {
    expect(detectUrlType('https://www.instagram.com/p/ABC123/')).toBe('instagram')
  })
  it('detects Instagram reel URLs', () => {
    expect(detectUrlType('https://www.instagram.com/reel/ABC123/')).toBe('instagram')
  })
  it('detects regular recipe URLs', () => {
    expect(detectUrlType('https://www.allrecipes.com/recipe/123/pasta/')).toBe('recipe')
  })
  it('throws on invalid URL', () => {
    expect(() => detectUrlType('not-a-url')).toThrow()
  })
})
