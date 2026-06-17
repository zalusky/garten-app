import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, AlertTriangle, Trash2, RefreshCw } from 'lucide-react'

const HEAVY_FEEDERS = ['tomate', 'gurke', 'zucchini', 'kürbis', 'mais', 'sellerie', 'kohl', 'brokkoli', 'kohlrabi']

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

function isHeavyFeeder(name) {
  return HEAVY_FEEDERS.some(f => name?.toLowerCase().includes(f))
}

export default function SeedInventory() {
  const seeds = useLiveQuery(() => db.seeds.toArray(), [])
  const cultures = useLiveQuery(() => db.cultures.toArray(), [])
  const pois = useLiveQuery(() => db.pois.toArray(), [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plant_name: '', variety: '', collected_date: '', expiry_date: '', qty: '', notes: '' })

  async function save() {
    if (!form.plant_name.trim()) return
    await db.seeds.add({ ...form })
    setForm({ plant_name: '', variety: '', collected_date: '', expiry_date: '', qty: '', notes: '' })
    setShowForm(false)
  }

  async function remove(id) {
    if (!confirm('Saatgut löschen?')) return
    await db.seeds.delete(id)
  }

  const expiring = seeds?.filter(s => { const d = daysUntil(s.expiry_date); return d !== null && d <= 60 && d >= 0 }) || []

  // Fruchtfolge-Warnsystem
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  const rotationWarnings = []

  if (cultures && pois) {
    const byPoi = {}
    cultures.forEach(c => {
      if (!c.poi_id || !c.planting_date) return
      const year = new Date(c.planting_date).getFullYear()
      if (!byPoi[c.poi_id]) byPoi[c.poi_id] = {}
      if (!byPoi[c.poi_id][year]) byPoi[c.poi_id][year] = []
      byPoi[c.poi_id][year].push(c.plant_name)
    })

    Object.entries(byPoi).forEach(([poiId, years]) => {
      const prev = years[lastYear] || []
      const curr = years[currentYear] || []
      const poi = pois.find(p => p.id === Number(poiId))
      curr.forEach(plant => {
        if (isHeavyFeeder(plant) && prev.some(p => isHeavyFeeder(p))) {
          rotationWarnings.push({ poi: poi?.name || 'Unbekannt', plant, prev: prev.filter(isHeavyFeeder) })
        }
      })
    })
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-green-800 text-lg">🌱 Saatgut-Inventar</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm">
          <Plus size={14} /> Saatgut
        </button>
      </div>

      {/* Ablaufwarnung */}
      {expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Ablaufwarnung Keimfähigkeit</p>
            {expiring.map(s => (
              <p key={s.id} className="text-xs text-amber-700">{s.plant_name} {s.variety} — läuft in {daysUntil(s.expiry_date)} Tagen ab</p>
            ))}
          </div>
        </div>
      )}

      {/* Fruchtfolge-Warnsystem */}
      {rotationWarnings.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 flex items-start gap-2">
          <RefreshCw size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">⚠️ Fruchtfolge-Warnung {currentYear}</p>
            <p className="text-xs text-red-600 mb-1">Starkzehrer folgt auf Starkzehrer — Bodennährstoffe werden erschöpft!</p>
            {rotationWarnings.map((w, i) => (
              <p key={i} className="text-xs text-red-700">
                <strong>{w.poi}:</strong> {w.plant} folgt auf {w.prev.join(', ')} vom Vorjahr
              </p>
            ))}
            <p className="text-xs text-red-500 mt-1">Empfehlung: Schwachzehrer (Salat, Kräuter, Erbsen) einplanen</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-green-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1.5 text-sm" placeholder="Pflanze" value={form.plant_name} onChange={e => setForm(f => ({...f, plant_name: e.target.value}))} />
            <input className="border rounded px-2 py-1.5 text-sm" placeholder="Sorte" value={form.variety} onChange={e => setForm(f => ({...f, variety: e.target.value}))} />
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500">Gesammelt / Gekauft</label>
              <input type="date" className="border rounded px-2 py-1.5 text-sm" value={form.collected_date} onChange={e => setForm(f => ({...f, collected_date: e.target.value}))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500">Haltbar bis (Keimfähigkeit)</label>
              <input type="date" className="border rounded px-2 py-1.5 text-sm" value={form.expiry_date} onChange={e => setForm(f => ({...f, expiry_date: e.target.value}))} />
            </div>
            <input className="border rounded px-2 py-1.5 text-sm" placeholder="Restmenge (g / Stk.)" value={form.qty} onChange={e => setForm(f => ({...f, qty: e.target.value}))} />
          </div>
          <textarea className="border rounded px-2 py-1.5 text-sm" rows={2} placeholder="Notizen…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-2">
            <button onClick={save} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm">Speichern</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {seeds?.map(s => {
          const days = daysUntil(s.expiry_date)
          const warn = days !== null && days <= 60 && days >= 0
          const expired = days !== null && days < 0
          return (
            <div key={s.id} className={`bg-white border rounded-xl px-4 py-3 flex justify-between items-start ${expired ? 'border-red-200 bg-red-50' : warn ? 'border-amber-200' : 'border-gray-100'}`}>
              <div>
                <p className="font-semibold text-sm">{s.plant_name} <span className="font-normal text-gray-500">{s.variety}</span>
                  {isHeavyFeeder(s.plant_name) && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Starkzehrer</span>}
                </p>
                {s.qty && <p className="text-xs text-gray-500">Restmenge: {s.qty}</p>}
                {s.expiry_date && <p className={`text-xs ${expired ? 'text-red-600' : warn ? 'text-amber-600' : 'text-gray-400'}`}>
                  {expired ? '⚠️ Abgelaufen' : `Haltbar bis ${s.expiry_date}`}{warn && !expired ? ` (noch ${days} Tage)` : ''}
                </p>}
                {s.notes && <p className="text-xs text-gray-400 mt-1">{s.notes}</p>}
              </div>
              <button onClick={() => remove(s.id)} className="text-red-300 hover:text-red-500 mt-1"><Trash2 size={14} /></button>
            </div>
          )
        })}
        {!seeds?.length && <p className="text-gray-400 text-sm text-center py-8">Noch kein Saatgut eingetragen</p>}
      </div>
    </div>
  )
}
