import Link from 'next/link'

type Nutrition = {
  calories: number | null; protein: number | null; carbs: number | null
  fat: number | null; fibre: number | null; sugar: number | null; sodium: number | null
} | null

type Props = { id: string; title: string; imageUrl: string | null; defaultServings: number; tags: string[]; nutrition: Nutrition; activeMacro: string | null }

export function RecipeCard({ id, title, imageUrl, defaultServings, tags }: Props) {
  return (
    <Link href={`/recipes/${id}`} className="block group animate-fade-up">
      <article className="overflow-hidden transition-all duration-300 group-hover:-translate-y-1" style={{ borderRadius: '4px' }}>
        {imageUrl ? (
          <div className="overflow-hidden aspect-[4/3]">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className="aspect-[4/3] flex items-center justify-center"
            style={{ background: 'var(--color-border-light)' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-ink-muted)', opacity: 0.4 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1"/>
              <path d="M15 9.5c0 .83-.67 1.5-1.5 1.5S12 10.33 12 9.5 12.67 8 13.5 8s1.5.67 1.5 1.5z" fill="currentColor"/>
              <path d="M5 16l3.5-4.5 2.5 3L14.5 10l4.5 6H5z" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
        )}
        <div className="py-4">
          <h3
            className="text-lg leading-snug transition-colors duration-200"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-ink)',
            }}
          >
            <span className="group-hover:underline decoration-1 underline-offset-4" style={{ textDecorationColor: 'var(--color-terracotta)' }}>
              {title}
            </span>
          </h3>
          <p className="text-xs mt-1.5 tracking-wide uppercase" style={{ color: 'var(--color-ink-muted)', fontWeight: 500, letterSpacing: '0.08em' }}>
            Serves {defaultServings}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5"
                  style={{
                    background: 'var(--color-sage-light)',
                    color: 'var(--color-sage)',
                    borderRadius: '2px',
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
