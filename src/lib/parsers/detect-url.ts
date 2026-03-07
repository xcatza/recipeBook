export type UrlType = 'instagram' | 'recipe'

export function detectUrlType(url: string): UrlType {
  const parsed = new URL(url) // throws if invalid
  const hostname = parsed.hostname.replace('www.', '')
  if (hostname === 'instagram.com') return 'instagram'
  return 'recipe'
}
