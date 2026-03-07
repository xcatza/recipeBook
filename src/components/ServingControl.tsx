'use client'

export function ServingControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Servings:</span>
      <button onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg">{'\u2212'}</button>
      <span className="w-8 text-center font-medium">{value}</span>
      <button onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg">+</button>
    </div>
  )
}
