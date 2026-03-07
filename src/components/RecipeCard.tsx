import Link from 'next/link'

type Props = { id: string; title: string; imageUrl: string | null; defaultServings: number; tags: string[] }

export function RecipeCard({ id, title, imageUrl, defaultServings, tags }: Props) {
  return (
    <Link href={`/recipes/${id}`} className="block group">
      <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No image</div>
        )}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">Serves {defaultServings}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
