'use client'
import { useState } from 'react'

export type NutritionValues = {
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fibre: number | null
  sugar: number | null
  sodium: number | null
}

type Props = {
  initialValues?: Partial<NutritionValues>
  onSave: (data: NutritionValues) => void
  onCancel: () => void
  saving?: boolean
}

const FIELDS: { key: keyof NutritionValues; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein',  label: 'Protein',  unit: 'g' },
  { key: 'carbs',    label: 'Carbs',    unit: 'g' },
  { key: 'fat',      label: 'Fat',      unit: 'g' },
  { key: 'fibre',    label: 'Fibre',    unit: 'g' },
  { key: 'sugar',    label: 'Sugar',    unit: 'g' },
  { key: 'sodium',   label: 'Sodium',   unit: 'mg' },
]

function toStr(v: number | null | undefined): string {
  return v == null ? '' : String(v)
}

function toNum(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

export function NutritionForm({ initialValues = {}, onSave, onCancel, saving }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, toStr(initialValues[f.key])]))
  )

  function handleSave() {
    const data = Object.fromEntries(
      FIELDS.map((f) => [f.key, toNum(values[f.key])])
    ) as NutritionValues
    onSave(data)
  }

  const inputStyle = {
    background: 'var(--color-warm-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    color: 'var(--color-ink)',
    width: '100%',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, unit }) => (
          <div key={key}>
            <label
              className="block text-xs mb-1"
              style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.05em' }}
            >
              {label} <span style={{ fontWeight: 400, color: 'var(--color-sage)' }}>({unit})</span>
            </label>
            <input
              type="number"
              min={0}
              value={values[key]}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              placeholder="—"
              className="px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-terracotta)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--color-terracotta)',
            color: 'var(--color-warm-white)',
            borderRadius: '2px',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm transition-all duration-200"
          style={{
            color: 'var(--color-ink-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            background: 'transparent',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
