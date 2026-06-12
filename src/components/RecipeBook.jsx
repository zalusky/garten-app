import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

export default function RecipeBook() {
  const recipes = useLiveQuery(() => db.recipes.toArray(), [])
  const [expanded, setExpanded] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', ingredients: '', notes: '' })

  async function save() {
    if (!form.title.trim()) return
    await db.recipes.add({ ...form })
    setForm({ title: '', ingredients: '', notes: '' })
    setShowForm(false)
  }

  async function remove(id) {
    if (!confirm('Rezept löschen?')) return
    await db.recipes.delete(id)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-green-800 text-lg">🧪 Rezeptbuch</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm">
          <Plus size={14} /> Rezept
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-green-200 rounded-xl p-4 flex flex-col gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder="Titel (z.B. Terra Preta Aktivierung)" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          <textarea className="border rounded px-3 py-1.5 text-sm" rows={4} placeholder="Zutaten & Anleitung…" value={form.ingredients} onChange={e => setForm(f => ({...f, ingredients: e.target.value}))} />
          <textarea className="border rounded px-3 py-1.5 text-sm" rows={2} placeholder="Erfahrungen & Notizen…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-2">
            <button onClick={save} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm">Speichern</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {recipes?.map(r => (
          <div key={r.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            >
              <span className="font-semibold text-green-900">{r.title}</span>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); remove(r.id) }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                {expanded === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            {expanded === r.id && (
              <div className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{r.ingredients}</p>
                {r.notes && <p className="text-sm text-gray-500 italic whitespace-pre-wrap">{r.notes}</p>}
              </div>
            )}
          </div>
        ))}
        {!recipes?.length && <p className="text-gray-400 text-sm text-center py-8">Noch keine Rezepte — füge Dünger-Rezepte, Jauchen etc. hinzu</p>}
      </div>
    </div>
  )
}
