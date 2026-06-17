import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, Trash2 } from 'lucide-react'

function phColor(ph) {
  if (!ph) return 'bg-gray-100 text-gray-600'
  if (ph < 5.5) return 'bg-red-100 text-red-700'
  if (ph < 6.5) return 'bg-amber-100 text-amber-700'
  if (ph <= 7.5) return 'bg-green-100 text-green-700'
  return 'bg-blue-100 text-blue-700'
}

function phLabel(ph) {
  if (!ph) return ''
  if (ph < 5.5) return 'zu sauer'
  if (ph < 6.5) return 'leicht sauer (optimal)'
  if (ph <= 7.5) return 'neutral (optimal)'
  return 'basisch'
}

export default function SoilTracker() {
  const pois = useLiveQuery(() => db.pois.where('type').anyOf(['beet', 'baum']).toArray(), [])
  const samples = useLiveQuery(() => db.soil.orderBy('date').reverse().toArray(), [])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ poi_id: '', date: new Date().toISOString().slice(0,10), ph: '', nitrogen: '', phosphorus: '', potassium: '', notes: '' })

  async function save() {
    if (!form.poi_id) return
    await db.soil.add({
      poi_id: Number(form.poi_id),
      date: form.date,
      ph: form.ph ? Number(form.ph) : null,
      nitrogen: form.nitrogen ? Number(form.nitrogen) : null,
      phosphorus: form.phosphorus ? Number(form.phosphorus) : null,
      potassium: form.potassium ? Number(form.potassium) : null,
      notes: form.notes || null,
    })
    setForm(f => ({ ...f, ph: '', nitrogen: '', phosphorus: '', potassium: '', notes: '' }))
    setShowForm(false)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-green-800 text-lg">🧪 Bodenproben</h2>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-sm">
          <Plus size={14} /> Probe
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-green-200 rounded-xl p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <select className="border rounded px-2 py-1.5 text-sm col-span-2" value={form.poi_id} onChange={e => setForm(f => ({...f, poi_id: e.target.value}))}>
              <option value="">— Beet / Baum wählen —</option>
              {pois?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500">Datum</label>
              <input type="date" className="border rounded px-2 py-1.5 text-sm" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500">pH-Wert (0–14)</label>
              <input type="number" step="0.1" min="0" max="14" className="border rounded px-2 py-1.5 text-sm" placeholder="z.B. 6.5" value={form.ph} onChange={e => setForm(f => ({...f, ph: e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500">Stickstoff N (mg/l)</label>
              <input type="number" className="border rounded px-2 py-1.5 text-sm" placeholder="N" value={form.nitrogen} onChange={e => setForm(f => ({...f, nitrogen: e.target.value}))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500">Phosphor P (mg/l)</label>
              <input type="number" className="border rounded px-2 py-1.5 text-sm" placeholder="P" value={form.phosphorus} onChange={e => setForm(f => ({...f, phosphorus: e.target.value}))} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-500">Kalium K (mg/l)</label>
              <input type="number" className="border rounded px-2 py-1.5 text-sm" placeholder="K" value={form.potassium} onChange={e => setForm(f => ({...f, potassium: e.target.value}))} />
            </div>
          </div>
          <textarea className="border rounded px-2 py-1.5 text-sm" rows={2} placeholder="Notizen…" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
          <div className="flex gap-2">
            <button onClick={save} className="bg-green-700 text-white px-4 py-1.5 rounded text-sm">Speichern</button>
            <button onClick={() => setShowForm(false)} className="border px-4 py-1.5 rounded text-sm">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {samples?.map(s => {
          const poi = pois?.find(p => p.id === s.poi_id)
          return (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold text-sm">{poi?.name || 'Unbekannt'}</span>
                  <span className="text-gray-400 text-xs ml-2">{s.date}</span>
                </div>
                <button onClick={() => db.soil.delete(s.id)} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.ph != null && (
                  <span className={`text-xs px-2 py-1 rounded-full font-mono ${phColor(s.ph)}`}>
                    pH {s.ph} — {phLabel(s.ph)}
                  </span>
                )}
                {s.nitrogen != null && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-mono">N: {s.nitrogen} mg/l</span>}
                {s.phosphorus != null && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-mono">P: {s.phosphorus} mg/l</span>}
                {s.potassium != null && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-mono">K: {s.potassium} mg/l</span>}
              </div>
              {s.notes && <p className="text-xs text-gray-500 mt-2">{s.notes}</p>}
            </div>
          )
        })}
        {!samples?.length && <p className="text-gray-400 text-sm text-center py-8">Noch keine Bodenproben eingetragen</p>}
      </div>
    </div>
  )
}
